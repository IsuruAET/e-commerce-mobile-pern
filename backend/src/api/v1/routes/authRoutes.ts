import { Router } from "express";
import { validateRequest } from "../../../middleware/validateRequest";
import {
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/authSchema";
import { AuthController } from "../controllers/authController";
import { requireAuth } from "../../../middleware/authHandler";

const router = Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  AuthController.register
);

router.post("/login", validateRequest(loginSchema), AuthController.login);

router.post(
  "/refresh-token",
  requireAuth,
  validateRequest(refreshTokenSchema),
  AuthController.refreshToken
);

router.post(
  "/logout",
  requireAuth,
  validateRequest(logoutSchema),
  AuthController.logout
);

// Google OAuth routes
router.get("/google", AuthController.googleAuth);
router.get("/google/callback", AuthController.googleCallback);

router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword
);

export default router;
