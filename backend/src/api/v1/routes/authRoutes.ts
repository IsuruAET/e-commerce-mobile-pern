import { Router } from "express";

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../schemas/authSchema";
import { AuthController } from "../controllers/authController";
import { validateRequest } from "middleware/validateRequest";

const router = Router();

// Public routes
router.post(
  "/register",
  validateRequest(registerSchema),
  AuthController.register
);

router.post("/login", validateRequest(loginSchema), AuthController.login);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

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

// Private routes
router.post(
  "/change-password",
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);

// Deactivate user account
router.patch("/deactivate", AuthController.deactivateAccount);

export default router;
