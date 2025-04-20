import { Request, Response, NextFunction } from "express";
import passport from "passport";

import { AuthService } from "../services/authService";
import { AuthRequest } from "middleware/authHandler";
import { AppError } from "middleware/errorHandler";
import { ErrorCode } from "constants/errorCodes";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const { refreshToken, ...rest } = await AuthService.registerUser(
        email,
        password,
        name
      );

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json(rest);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { refreshToken, ...rest } = await AuthService.loginUser(
        email,
        password
      );

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json(rest);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      const { refreshToken: newRefreshToken, ...rest } =
        await AuthService.refreshUserToken(refreshToken);

      // Set new refresh token in HTTP-only cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return only the access token to the client
      res.status(200).json(rest);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      await AuthService.logoutUser(refreshToken);

      // Clear the refresh token cookie
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      // Clear CSRF token cookies
      res.clearCookie("csrf_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.clearCookie("csrf_token_js", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  }

  static googleAuth(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);
  }

  static googleCallback(req: Request, res: Response, next: NextFunction) {
    passport.authenticate(
      "google",
      { session: false },
      async (err: any, data: any) => {
        try {
          const { refreshToken, ...rest } =
            await AuthService.handleGoogleCallback(
              data?.user,
              data?.tokens,
              err
            );

          // Set refresh token in HTTP-only cookie
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          res.status(200).json(rest);
        } catch (error) {
          next(error);
        }
      }
    )(req, res, next);
  }

  static async changePassword(
    req: Request & AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.auth?.userId;

      if (!userId) {
        throw new AppError(ErrorCode.UNAUTHORIZED);
      }

      const result = await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetUserPassword(token, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async softDeleteAccount(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new AppError(ErrorCode.UNAUTHORIZED);
      }

      await AuthService.softDeleteUserAccount(userId);

      // Clear the refresh token cookie
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      // Clear CSRF token cookies
      res.clearCookie("csrf_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.clearCookie("csrf_token_js", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
