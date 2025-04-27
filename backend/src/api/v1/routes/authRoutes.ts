import { Router } from "express";

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../schemas/authSchema";
import { AuthController } from "../controllers/authController";
import { validateRequest } from "middleware/validateRequest";
import { requirePermission } from "middleware/authHandler";

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
  requirePermission(["manage_auth"]),
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);

// Update profile route
router.patch(
  "/profile",
  requirePermission(["manage_auth"]),
  validateRequest(updateProfileSchema),
  AuthController.updateProfile
);

// Deactivate account route (can be used for both self-deactivation and admin deactivation)
router.patch(
  "/deactivate",
  requirePermission(["manage_auth"]),
  AuthController.deactivateAccount
);

export default router;
