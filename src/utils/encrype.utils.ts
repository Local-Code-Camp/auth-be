import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
dotenv.config()

const salt: number = Number(process.env.SALT)

export const hash = (data: string, cb: any) => bcrypt.hash(data, salt, (err: Error | undefined, hash: string) => {
  cb(err, hash)
})

export const match = (data: { raw: string, compare: string }, cb: any) => bcrypt.compare(data.raw, data.compare, (err: Error | undefined, same: boolean) => {
  console.log()
  cb(err, same)
})