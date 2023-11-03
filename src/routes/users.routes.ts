import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handlers'
const usersRouter = Router()
/*
des: đăng nhập
path: /users/register
method: POST
body: {email, password}
*/
usersRouter.get('/login', loginValidator, wrapAsync(loginController))

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
usersRouter.post('/register', registerValidator, wrapAsync(registerController))

/*
  des: lougout
  path: /users/logout
  method: POST
  Header: {Authorization: Bearer <access_token>}
  body: {refresh_token: string}
*/

usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
des: verify email khi người dùng nhấn vào cái link trong email, họ sẽ gữi lên email_verify_token
để ta kiểm tra, tìm kiếm user đó và update account của họ thành verify, 
đồng thời gữi at rf cho họ đăng nhập luôn, k cần login
path: /verify-email
method: POST
không cần Header vì chưa đăng nhập vẫn có thể verify-email
body: {email_verify_token: string}
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyController))

/*
des: resend email verify
path: /users/resend-email-verify
method: POST
headers: {Authorization: Bearer <access_token>}
*/
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/*
des: cung cấp email để reset password, gữi email cho người dùng
path: /forgot-password
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
body: {email: string}
*/
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
des: Verify link in email to reset password
path: /verify-forgot-password
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
body: {forgot_password_token: string}
*/
usersRouter.post('/verify-forgot-password', verifyForgotPasswordValidator, wrapAsync(verifyForgotPasswordController))

export default usersRouter
