import mongodb from 'mongodb'

export interface ServiceInterface {
  _id: mongodb.ObjectId,
  name: string,
  active: boolean
}
