import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { SuccessResponse } from "utils/responseUtils";
import { AuthResponse } from "types/auth";
import { setRefreshTokenCookie, clearAuthCookies } from "utils/cookieUtils";

import { AuthService } from "../services/authService";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  private handleAuthResponse(
    res: Response,
    response: SuccessResponse<AuthResponse>,
    statusCode: number = 200
  ): void {
    const { refreshToken, ...rest } = response.data;
    setRefreshTokenCookie(res, refreshToken);
    res.status(statusCode).json({
      ...response,
      data: rest,
    });
  }

  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const response = (await this.authService.registerUser(
        req,
        email,
        password,
        name
      )) as SuccessResponse<AuthResponse>;

      this.handleAuthResponse(res, response, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const response = (await this.authService.loginUser(
        req,
        email,
        password
      )) as SuccessResponse<AuthResponse>;

      this.handleAuthResponse(res, response);
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

      const response = (await this.authService.refreshUserToken(
        req,
        refreshToken,
        accessToken
      )) as SuccessResponse<AuthResponse>;

      this.handleAuthResponse(res, response);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      const response = await this.authService.logoutUser(req, refreshToken);

      clearAuthCookies(res);
      res.status(200).json(response);
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
          const response = (await this.authService.handleGoogleCallback(
            req,
            data?.user,
            data?.tokens,
            err
          )) as SuccessResponse<AuthResponse>;

          this.handleAuthResponse(res, response);
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
      const refreshToken = req.cookies.refreshToken;

      const result = await this.authService.changePassword(
        req,
        userId,
        currentPassword,
        newPassword,
        refreshToken
      );

      clearAuthCookies(res);
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
      const result = await this.authService.requestPasswordReset(req, email);
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
      const response = (await this.authService.resetUserPassword(
        req,
        token,
        password
      )) as SuccessResponse<AuthResponse>;

      this.handleAuthResponse(res, response);
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
      const response = await this.authService.deactivateUserAccount(
        req,
        userId
      );

      clearAuthCookies(res);
      res.status(200).json(response);
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
      const result = await this.authService.updateUserProfile(req, userId, {
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
      const response = (await this.authService.createPassword(
        req,
        token,
        password
      )) as SuccessResponse<AuthResponse>;

      this.handleAuthResponse(res, response);
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
        req,
        email
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCsrfToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await this.authService.getCsrfToken(req, res);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
