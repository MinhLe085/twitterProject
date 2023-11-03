import { RegisterReqBody } from '~/models/requests/User.requests'
import databaseService from './database.services'
import User from '~/models/schemas/User.shema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import { log } from 'console'
config()

class UsersService {
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    })
  }
  private signForgotPassword(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
  }

  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())
    //lưu vô collection refresh_token
    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    //giả lập việc gửi mail
    console.log(email_verify_token)
    return { access_token, refresh_token }
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    //lưu vô collection refresh_token
    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    //cập nhật lại user
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token: '',
            updated_at: '$$NOW',
            verify: UserVerifyStatus.Verified
          }
        }
      ]
    )
    //tạo access token và refresh token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    //lưu vô collection refresh_token
    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return { access_token, refresh_token }
  }

  async resendEmailVerifyController(user_id: string) {
    // tạo mới một email_verify_token
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    // cập nhật lại email_verify_token
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token: email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    // giả lập việc gửi email
    console.log(email_verify_token)
    return {
      message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS
    }
  }
  async forgotPassword(user_id: string) {
    //tạo mới 1 forgot_pasword_token
    const forgot_password_token = await this.signForgotPassword(user_id)
    //cập nhật lại forgot_password_token
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            forgot_password_token: forgot_password_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //giả lập việc gửi forgot password email
    console.log(forgot_password_token);
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
}

const userService = new UsersService()
export default userService
