import express from 'express'
import { GetLCCPermission, GetLCCServices } from '../services'

export const LCC = express.Router()

LCC.get('/services', GetLCCServices)
LCC.get('/permissions', GetLCCPermission)
