import nodemailer from "nodemailer";

import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";
import { logger } from "middleware/logger";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// TODO: This is a temporary development solution. For production:
// - Use a proper email service provider (SendGrid, Mailgun, etc.)
// - Implement proper SSL certificate verification
// - Consider using OAuth2 authentication instead of password-based auth
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error("Error sending email:", error);
    throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR);
  }
};
