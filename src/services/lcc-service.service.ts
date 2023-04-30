import { ObjectId } from 'mongodb'
import { find } from "./db.service"

export const GetLCCServices = async (req: any, res: any) => {
  try {
    const data = await find('lcc_services', {})
    res.json(data)
  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error')
  }
}

export const GetLCCPermission = async (req: any, res: any) => {
  try {
    const query = req.query.service_id ? { service_id: new ObjectId(req.query.service_id) } : {}
    const data = await find('permissions', query)
    res.json(data)
  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error')
  }
}