import mailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const transporter = mailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
})

export const sendMail = (data: { to: string, sub: string, text: string }, cb: any) => {
  console.log(process.env.EMAIL, process.env.PASSWORD)
  const mailOption = {
    from: process.env.EMAIL,
    to: data.to,
    subject: data.sub,
    text: data.text
  }

  transporter.sendMail(mailOption, (err, info) => {
    cb(err, info)
  })
}