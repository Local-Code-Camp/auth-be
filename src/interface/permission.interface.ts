import mongodb from 'mongodb'

export interface PermissionInterface {
  _id: mongodb.ObjectId,
  name: string,
  service_id: mongodb.ObjectId
}
