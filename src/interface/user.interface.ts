import mongodb from 'mongodb'

export interface UserInterface {
  name?: string
  email?: string
  email_verified?: boolean
  created_date?: Date
  roles?: string[]
  location?: {
    townshipID: mongodb.ObjectId
    address: string
  }
  phone?: string
  organization_id?: mongodb.ObjectId
  fingerprint?: string
}