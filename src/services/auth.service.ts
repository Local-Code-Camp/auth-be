import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { hash, match } from '../utils'
import { add, find, findOne, update } from './db.service'
import { UserInterface } from '../interface'
import { sendMail } from './mail.service'
dotenv.config()

const CERTIFICATE = process.env.CERTIFICATE as string

// create a new user
export const RegisterUser = (req: any, res: any) => {
  const data: UserInterface = {}

  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.fingerprint
  ) {
    res.status(400).send('Bad request')
    return
  }

  try {
    // check minimum params


    // password hashing
    // check detail https://delinea.com/blog/how-do-passwords-work#:~:text=Hashing%20turns%20your%20password%20(or,hash%E2%80%9D%20created%20by%20your%20password.
    hash(req.body.fingerprint, async (err: any, hash: string) => {
      if (err) throw new Error('fingerprint hashing error')

      // data projection with User Interface
      data.fingerprint = hash
      data.created_date = new Date()
      data.name = req.body.name
      data.email = req.body.email
      data.email_verified = false

      try {
        const id = await add('users', data, 'email')

        // generate validate token
        const token = jwt.sign({
          email: req.body.email,
          hash
        }, CERTIFICATE as string, { expiresIn: '1d' })

        sendMail(
          {
            to: req.body.email, sub: 'Verify your Alpha POS account.', text: `
            Hello ${req.body.name},
            Click the link to verify your Alpha POS account.
            http://localhost:3000/auth/verify/${token}`
          },
          (err: any, info: any) => {
            if (err) throw new Error('mailing error')
            res.json({ id })
          })
      } catch (err) {
        console.warn(err)
        res.status(400).send('Bad request')
      }

    })
  } catch (err) {
    console.warn(err)
    res.status(500).send('internal server error')
  }

}

// verify a created user
export const VerifyUser = async (req: any, res: any) => {
  const token = req.params.token
  try {
    const data: any = jwt.verify(token, CERTIFICATE as string)
    const checkUser = await findOne('users', { email: data.email, fingerprint: data.hash })

    if (checkUser) {
      await update('users', { email: data.email }, { email_verified: true }, { upsert: false })
      res.json({ message: 'success' })
    } else {
      throw new Error('Invalid request')
    }

  } catch (err) {
    console.log(err)
    res.status(400).send('Bad request')
  }
}

// login password
export const Login = async (req: any, res: any) => {
  const { email, password } = req.body
  const checkUser: any = await findOne('users', { email })
  if (checkUser) {
    match({ raw: password, compare: checkUser.fingerprint }, (err: any, same: boolean) => {
      if (same) {
        const token = jwt.sign({
          name: checkUser.name,
          fingerprint: checkUser.fingerprint,
          id: checkUser._id
        }, CERTIFICATE as string, {
          expiresIn: '1d'
        })
        res.json({ token })
      } else {
        res.status(401).send('Unauthorized')
      }
    })
  } else {
    res.status(400).send('bad request')
  }
}

// change password
export const ChangePassword = async (req: any, res: any) => {
  if (!req.headers.authorization || !req.body.new_password) res.status(400).send('Bad request')
  const token = req.headers.authorization.replace('Bearer ', '')
  const isValid: any = jwt.verify(token, CERTIFICATE as string)
  if (isValid) {
    // check user with password
    try {
      const data = await findOne('users', { _id: new ObjectId(isValid.id), fingerprint: isValid.fingerprint })
      if (data) {
        // hash new password
        hash(req.body.new_password, async (err: Error, hash: string) => {
          if (err) {
            console.log(err, '.... err')
            return res.status(500).send('Internal server error')
          }
          try {
            const op = await update('users', { _id: new ObjectId(isValid.id) }, { fingerprint: hash }, { upsert: false })
            res.send(op)
          } catch (err) {
            console.log(err)
            res.status(400).send('Bad request')
          }

        })
      } else {
        throw new Error('User not found')
      }
    } catch (err) {
      console.log(err)
      res.status(401).send('Unauthorized')
    }
  }
}

// forgot password
export const ForgotPassword = async (req: any, res: any) => {

  if (!req.body.email) res.status(401).send('Unauthorized')

  try {
    const findUser = await findOne('users', { email: req.body.email })
    if (findUser) {
      const resetCode = Math.floor(Math.random() * 1000000)
      sendMail({
        to: req.body.email,
        sub: `Password reset code`,
        text: `Hello ${findUser.name},\nReset code for your password is ${resetCode}`
      },
        (err: Error, info: any) => {
          hash(String(resetCode), (error: Error, hash: any) => {
            const token = jwt.sign({ token: hash, email: req.body.email }, CERTIFICATE as string, { expiresIn: '15m' })
            res.json({ token })
          })
        })
    } else {
      res.status(404).send(`User not found.`)
    }
  } catch (err) {
    console.log(err)
    res.status(500).send('internal server error')
  }

}

// set new password for forgot user
export const SetNewPassword = async (req: any, res: any) => {
  const auth = req.headers.authorization
  const otp = req.body.otp
  const newPassword = req.body.password

  if (!auth || !otp || !newPassword) res.status(401).send('Unauthorized')

  try {
    // decrype token
    const token = auth.replace('Bearer ', '')
    const data: any = jwt.verify(token, CERTIFICATE as string)
    // match token with password
    match({
      raw: otp,
      compare: data.token
    }, (err: Error, same: boolean) => {
      if (same) {
        // hash new password
        hash(newPassword, async (err: Error, fingerprint: any) => {
          if (err) throw Error('new password hashing error')
          const op = await update('users', { email: data.email }, { fingerprint }, { upsert: false })
          res.json({ message: 'success' })
        })
      } else {
        res.status(401).send('Unauthorized')
      }
    })
  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error.')
  }
}

// register from invitation link
export const UserInvite = async (req: any, res: any) => {
  const token = req.headers.authorization
  const emails = req.body.emails

  const verify = jwt.verify(token, CERTIFICATE)

  if (!verify || !token || !emails) res.status(401).send('Unauthorized')

  try {
    res.send('hello')
  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error.')
  }
}

// auth middleware
export const AuthMiddleware = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization

  if (!token) {
    res.status(400).send('Bad request')
    return
  }

  try {
    const verify: any = jwt.verify(token.replace('Bearer ', ''), CERTIFICATE)

    const user = await findOne('users', { _id: new ObjectId(verify.id), fingerprint: verify.fingerprint })

    if (!user) {
      res.status(401).send('Unauthorized')
      return
    }

    req.verify = verify
    req.user = user
    next()
  } catch (err) {
    res.status(401).send('Unauthorized')
  }

}