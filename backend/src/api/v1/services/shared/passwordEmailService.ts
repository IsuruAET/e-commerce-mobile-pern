import { BaseService } from "./baseService";
import { AppError } from "middleware/errorHandler";
import { sendEmail } from "utils/emailUtils";
import { JwtUtils } from "utils/jwtUtils";
import { ErrorCode } from "constants/errorCodes";
import { redisTokenService } from "./redisTokenService";
import { prismaClient } from "config/prisma";

export class PasswordEmailService extends BaseService {
  private static instance: PasswordEmailService;

  private constructor() {
    super(prismaClient);
  }

  public static getInstance(): PasswordEmailService {
    if (!PasswordEmailService.instance) {
      PasswordEmailService.instance = new PasswordEmailService();
    }
    return PasswordEmailService.instance;
  }

  async generateAndSendPasswordCreationToken(userId: string, email: string) {
    // Check for recent token requests using Redis
    const recentTokens = await redisTokenService.getToken(
      "PASSWORD_CREATION",
      userId
    );
    if (recentTokens) {
      throw new AppError(ErrorCode.ACTIVE_PASSWORD_CREATION_TOKEN);
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
    const createPasswordUrl = `${process.env.APP_URL}/create-password?token=${token}`;
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
  }

  async generateAndSendPasswordResetToken(userId: string, email: string) {
    // Check for recent token requests using Redis
    const recentTokens = await redisTokenService.getToken(
      "PASSWORD_RESET",
      userId
    );
    if (recentTokens) {
      throw new AppError(ErrorCode.ACTIVE_PASSWORD_RESET_TOKEN);
    }

    // Generate token using JWT
    const resetToken = JwtUtils.generatePasswordToken(userId, "1h");
    const expiresIn = 60 * 60; // 1 hour in seconds

    await redisTokenService.setToken(
      "PASSWORD_RESET",
      resetToken,
      userId,
      expiresIn
    );

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #333333; text-align: center; margin-bottom: 20px;">Password Reset Request</h1>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">Hello,</p>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">This link will expire in 1 hour for security reasons.</p>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="color: #666666; line-height: 1.6; margin-bottom: 20px; word-break: break-all;">${resetUrl}</p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="color: #999999; font-size: 12px; text-align: center;">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      `,
    });
  }
}

export const passwordEmailService = PasswordEmailService.getInstance();
