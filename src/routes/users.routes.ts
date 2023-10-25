import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/user.middlewares'
const usersRouter = Router()

usersRouter.get('/login', loginValidator, loginController)
/*
Description: Register a new user
path: /register
method: POST
body: {
  name: string,
  email: string,
  password: string,
  confirm_Password: string
  date_of_birth: string theo chuẩn ISO 8601
}
*/
usersRouter.post('/register', registerValidator, registerController)

export default usersRouter
