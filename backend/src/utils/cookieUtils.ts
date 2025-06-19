import { COOKIE_CONFIG } from "config/cookies";
import { Response } from "express";

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, COOKIE_CONFIG.REFRESH_TOKEN.options);
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(COOKIE_CONFIG.REFRESH_TOKEN.name);
  res.clearCookie(COOKIE_CONFIG.CSRF.name);
};
