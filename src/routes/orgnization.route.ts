import express from 'express'
import { AddServicePermission, AuthMiddleware, CreateOrganization, GetMyOrganization, SubscribeService, UpdateOrganization } from '../services'

export const Organization = express.Router()

Organization.use(AuthMiddleware)

Organization.post('/create', CreateOrganization)

Organization.patch('/update', UpdateOrganization)

Organization.patch('/subscribe', SubscribeService)

Organization.patch('/permission', AddServicePermission)

Organization.get('/', GetMyOrganization)

