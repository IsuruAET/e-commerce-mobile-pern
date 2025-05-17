import { BaseService } from "./baseService";
import { AppError } from "middleware/errorHandler";
import { sendEmail } from "utils/emailUtils";
import { JwtUtils } from "utils/jwtUtils";
import { ErrorCode } from "constants/errorCodes";
import { redisTokenService } from "./redisTokenService";

export class PasswordService extends BaseService {
  static async generateAndSendPasswordCreationToken(
    userId: string,
    email: string
  ) {
    return await this.handleWithTimeout(async () => {
      // Check for recent token requests using Redis
      const recentTokens = await redisTokenService.getToken(
        "PASSWORD_CREATION",
        userId
      );
      if (recentTokens) {
        throw new AppError(ErrorCode.TOO_MANY_PASSWORD_ATTEMPTS);
      }

      // Generate token using JWT
      const token = JwtUtils.generatePasswordToken(userId, "24h");
      const expiresIn = 24 * 60 * 60; // 24 hours in seconds

      // Store the token in Redis
      await redisTokenService.setToken(
        "PASSWORD_CREATION",
        token,
        userId,
        expiresIn
      );

      // Send welcome email with password creation link
      const createPasswordUrl = `${process.env.FRONTEND_URL}/create-password?token=${token}`;
      await sendEmail({
        to: email,
        subject: "Welcome to Our Platform - Create Your Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #333333; text-align: center; margin-bottom: 20px;">Welcome to Our Platform!</h1>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">Hello,</p>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">Your account has been created. To get started, please create your password using the link below.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${createPasswordUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Create Password</a>
              </div>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">This link will expire in 24 hours for security reasons.</p>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
              <p style="color: #666666; line-height: 1.6; margin-bottom: 20px; word-break: break-all;">${createPasswordUrl}</p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p style="color: #999999; font-size: 12px; text-align: center;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
      });
    }, 15000);
  }

  static async validatePasswordCreationToken(
    token: string
  ): Promise<string | null> {
    return await redisTokenService.getToken("PASSWORD_CREATION", token);
  }

  static async deletePasswordCreationToken(token: string): Promise<void> {
    await redisTokenService.deleteToken("PASSWORD_CREATION", token);
  }
}
