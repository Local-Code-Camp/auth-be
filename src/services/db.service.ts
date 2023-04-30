import mongodb, { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const CONNECTION_STR = process.env.CONNECTION_STR as string
const DB_NAME = process.env.DB_NAME

const client = async () => {
  const client = new MongoClient(CONNECTION_STR)
  await client.connect()
  return client
}

export const add = async (docName: string, data: any, uid: string) => {
  const connect = await client()
  const doc = connect.db(DB_NAME).collection(docName)
  const checkUID = await doc.findOne({ [uid]: data[uid] })
  if (checkUID) throw new Error('duplicated uid')
  const op = await doc.insertOne(data)
  return op.insertedId
}

export const findOne = async (docName: string, query?: any) => {
  const connect = await client()
  const doc = connect.db(DB_NAME).collection(docName)
  const data = await doc.findOne(query || {})
  // const count = await doc.countDocuments(query || {})
  connect.close() // close db after operation
  return data
}

export const find = async (docName: string, query?: any, pagi?: { index: number, pageSize: number }) => {
  const connect = await client()
  const doc = connect.db(DB_NAME).collection(docName)

  if (pagi) {
    let pageIndex = pagi.index - 1
    let docCount = await doc.countDocuments()
    let pageSize = pagi.pageSize
    const data = await doc.find(query || {}).skip(pageIndex * pageSize).limit(pageSize).toArray()
    connect.close()
    return {
      index: pageIndex + 1,
      total: Math.ceil(docCount / pageSize),
      data
    }
  } else {
    const data = await doc.find(query || {}).toArray()
    connect.close()
    return data
  }
}

export const update = async (
  docName: string,
  filter: mongodb.Filter<mongodb.BSON.Document>,
  update: {},
  option?: mongodb.UpdateOptions | undefined
) => {
  const connect = await client()
  const doc = connect.db(DB_NAME).collection(docName)
  const modify: mongodb.UpdateFilter<mongodb.BSON.Document> | Partial<mongodb.BSON.Document> = { $set: update };
  const op = await doc.updateOne(filter, modify, option)
  return op
}