import { Request, Response } from 'express'
import User from '~/models/schemas/User.shema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'minh@gmail.com' && password === '123123123') {
    return res.json({
      data: [
        { name: 'Minh', yob: 2004 },
        { name: 'Khang', yob: 2004 },
        { name: 'Nhím', yob: 2004 },
        { name: 'Mạnh', yob: 2004 }
      ]
    })
  } else {
    return res.status(400).json({
      error: 'login failed'
    })
  }
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await userService.register(req.body) //req.body = RegisterReqBody
    return res.status(201).json({
      message: 'Register success',
      result
    })
  } catch (error) {
    return res.status(400).json({
      message: 'Register failed',
      error
    })
  }
}
