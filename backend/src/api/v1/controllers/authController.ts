import { Request, Response, NextFunction } from "express";
import passport from "passport";

import { AuthService } from "../services/authService";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await AuthService.register(email, password, name);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
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
          const result = await AuthService.handleGoogleCallback(
            data?.user,
            data?.tokens,
            err
          );
          res.status(200).json(result);
        } catch (error) {
          next(error);
        }
      }
    )(req, res, next);
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
