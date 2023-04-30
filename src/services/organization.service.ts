import { PermissionInterface, ServiceInterface } from '../interface'
import { add, find, findOne, update } from './db.service'
import { ObjectId } from 'mongodb'

export const CreateOrganization = async (req: any, res: any) => {
  const name = req.body.name

  if (!name) {
    res.status(400).send('Bad request')
    return
  }

  try {
    // check token and user
    const user = await findOne('users', { _id: new ObjectId(req.verify.id), fingerprint: req.verify.fingerprint })
    if (!user) {
      res.status(401).send('Unauthorized')
      return
    }
    await add('organization', { name, owner_id: user._id }, '_id')
    res.json({ message: 'success' })

  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error')
  }

}

export const GetMyOrganization = async (req: any, res: any) => {
  try {
    const data = await find('organization', { owner_id: new ObjectId(req.verify.id) }, { index: 1, pageSize: 10 })
    res.json(data)
  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error')
  }
}

export const UpdateOrganization = async (req: any, res: any) => {
  if (Object.keys(req.body).length === 0 || !req.body.id) {
    res.status(400).send('Bad request')
    return
  }

  try {
    const data: any = {}
    if (req.body.name) data.name = req.body.name
    if (req.body.info) data.info = req.body.info

    if (req.body.address || req.body.phone || req.body.email || req.body.website) {
      data.contact = {}
    }

    if (req.body.address) data.contact.address = req.body.address
    if (req.body.phone) data.contact.phone = req.body.phone
    if (req.body.email) data.contact.email = req.body.email
    if (req.body.website) data.contact.website = req.body.website

    const op = await update('organization', { _id: new ObjectId(req.body.id) }, data, { upsert: false })
    if (op.modifiedCount === 0) {
      res.status(404).send('Request not found')
    } else {
      res.send({ message: 'success' })
    }

  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error')
    return
  }
}

export const SubscribeService = async (req: any, res: any) => {
  const orgId = req.body.organization_id
  const serviceId = req.body.service_id

  if (!orgId || !serviceId) {
    res.status(400).send('Bad request')
    return
  }

  try {
    const org = await findOne('organization', { _id: new ObjectId(orgId), owner_id: new ObjectId(req.verify.id) })

    if (!org) {
      res.status(404).send('Organization not found')
      return
    }

    // check service in org
    if (org.subscribed) {
      const checkSameService = org.subscribed.filter((item: any) => item.id === serviceId)
      if (checkSameService) {
        res.status(409).send('Service already subscribed')
        return
      }
    }

    // check valid service or not
    const checkService = await findOne('lcc_services', { _id: new ObjectId(serviceId) })
    if (!checkService) {
      res.status(400).send('Bad request')
      return
    }

    await update('organization', { _id: new ObjectId(orgId) }, { "subscribed": { [checkService.name]: [] } }, { upsert: false })
    res.send({ message: 'success' })

  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error')
  }
}

export const AddServicePermission = async (req: any, res: any) => {
  const serviceID = req.body.service_id
  const orgId = req.body.organization_id
  const permissions = req.body.permissions

  if (!serviceID || !orgId || !permissions) {
    res.status(400).send('Bad request')
    return
  }

  try {
    // check service in org
    const org = await findOne('organization', {
      owner_id: new ObjectId(req.verify.id),
      _id: new ObjectId(orgId)
    })

    if (!org) {
      res.status(401).send('Unauthorized organization')
      return
    }

    // get service name
    const service = await findOne('lcc_services', { _id: new ObjectId(serviceID) }) as ServiceInterface
    if (!service) {
      res.status(401).send('Unauthorized service')
      return
    }

    // get permission list 
    const getPermissions = await find('permissions', { service_id: service._id }) as PermissionInterface[]
    const permissionIds = getPermissions.map(item => item._id.toString())
    // insert added permission
    const validPermission = permissions.filter((item: any) => permissionIds.includes(item))

    if (validPermission.length !== permissions.length) {
      res.status(401).send('Unauthorized permission')
      return
    }


    // update organization
    await update('organization',
      {
        _id: new ObjectId(orgId)
      },
      {
        subscribed: {
          [service.name]: permissions.map((item: string) => new ObjectId(item)) // need to modify [check exisistance and update]
        }
      }
    )

    res.json({
      message: 'success'
    }
    )
  } catch (err) {
    console.log(err)
    res.status(500).send('Internal server error')
  }
}

