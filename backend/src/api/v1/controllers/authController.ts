import { Request, Response, NextFunction } from "express";
import passport from "passport";

import { AuthService } from "../services/authService";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const { refreshToken, ...rest } = await this.authService.registerUser(
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

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { refreshToken, ...rest } = await this.authService.loginUser(
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

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken as string;
      const accessToken = req.headers.authorization?.split(" ")[1] as string;

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshUserToken(refreshToken, accessToken);

      // Set new refresh token in HTTP-only cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await this.authService.logoutUser(refreshToken);
      }

      // Clear refresh token cookie
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

  googleAuth(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);
  }

  async googleCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    passport.authenticate(
      "google",
      { session: false },
      async (err: any, data: any) => {
        try {
          const { refreshToken, ...rest } =
            await this.authService.handleGoogleCallback(
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

  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.auth?.userId as string;

      const result = await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      const result = await this.authService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await this.authService.resetUserPassword(token, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deactivateAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.auth?.userId as string;
      await this.authService.deactivateUserAccount(userId);

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

      res.status(200).json({ message: "Account deactivated successfully" });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.auth?.userId as string;
      const { name, phone } = req.body;
      const result = await this.authService.updateUserProfile(userId, {
        name,
        phone,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await this.authService.createPassword(token, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async requestNewPasswordCreationToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      const result = await this.authService.requestNewPasswordCreationToken(
        email
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
