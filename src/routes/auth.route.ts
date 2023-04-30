import express from 'express'
import { ChangePassword, ForgotPassword, Login, RegisterUser, SetNewPassword, VerifyUser } from '../services'

export const Auth = express.Router()

Auth.post('/register', RegisterUser)

Auth.get('/verify/:token', VerifyUser)

Auth.post('/login', Login)

Auth.put('/change-password', ChangePassword)

Auth.get('/forgot', ForgotPassword)

Auth.get('/forgot/set-new-password', SetNewPassword)
