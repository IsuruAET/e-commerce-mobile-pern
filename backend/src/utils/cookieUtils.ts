import { COOKIE_CONFIG } from "config/cookies";
import { Response } from "express";

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, COOKIE_CONFIG.REFRESH_TOKEN.options);
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(
    COOKIE_CONFIG.REFRESH_TOKEN.name,
    COOKIE_CONFIG.REFRESH_TOKEN.options
  );
  res.clearCookie(COOKIE_CONFIG.CSRF.name, COOKIE_CONFIG.CSRF.options);
  res.clearCookie(COOKIE_CONFIG.CSRF_JS.name, COOKIE_CONFIG.CSRF_JS.options);
};
