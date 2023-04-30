import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config()

import { Auth, LCC, Organization } from './routes'

const APP = express()
const PORT = process.env.PORT || 80

APP.use(cors()) // must add domain whitelist in prod

APP.use(express.json()) // accept body json in http method

APP.use('/auth', Auth) // auth routes

APP.use('/org', Organization) // organization routes

APP.use('/lcc', LCC) // Service that provide by LCC (LCC = Local Code Camp)

APP.all('*', (req, res) => {
  res.status(404)
})

APP.listen(PORT, () => console.log(`server running at port : ${PORT}`))