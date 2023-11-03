import { NextFunction, Request, Response } from 'express'
import User from '~/models/schemas/User.shema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { LoginReqBody, LogoutReqBody, RegisterReqBody, TokenPayload } from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/message'
import { JwtPayload } from 'jsonwebtoken'
import { UserVerifyStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/Errors'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userService.login(user_id.toString())
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result: result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await userService.register(req.body) //req.body = RegisterReqBody
  return res.status(201).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await userService.logout(refresh_token)
  return res.json(result)
}

export const emailVerifyController = async (req: Request, res: Response) => {
  const user = req.user as User
  // nếu email đã được verify rồi in thông báo
  if (user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  // cập nhật lại user trên database
  const result = await userService.verifyEmail((user._id as ObjectId).toString())
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  // lấy user_id từ access token
  const { user_id } = req.decoded_authorization as TokenPayload
  // tìm user trên database
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // nếu user không tồn tại thì throw lỗi
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  // nếu user đã verify thì in thông báo
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  // cập nhật email_verify_token mới vào database và resend email_verify_token
  const result = await userService.resendEmailVerifyController(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { _id } = req.user as User
  const result = await userService.forgotPassword((_id as ObjectId).toString())
  return res.json(result)
}

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}