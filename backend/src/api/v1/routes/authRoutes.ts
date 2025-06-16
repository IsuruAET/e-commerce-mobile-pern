import { Router } from "express";
import { validateGoogleCallback } from "config/passport";

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  createPasswordSchema,
  requestPasswordCreationSchema,
} from "../schemas/authSchema";
import { AuthController } from "../controllers/authController";
import { validateRequest } from "middleware/validateRequest";
import { requirePermission } from "middleware/authHandler";

const router = Router();
const authController = new AuthController();

// Public routes
router.post("/register", validateRequest(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post("/login", validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post("/refresh-token", (req, res, next) =>
  authController.refreshToken(req, res, next)
);

router.post("/logout", (req, res, next) =>
  authController.logout(req, res, next)
);

// Google OAuth routes
router.get("/google", (req, res, next) =>
  authController.googleAuth(req, res, next)
);

router.get("/google/callback", validateGoogleCallback, (req, res, next) =>
  authController.googleCallback(req, res, next)
);

router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

// Private routes
router.post(
  "/change-password",
  requirePermission(["manage_auth"]),
  validateRequest(changePasswordSchema),
  (req, res, next) => authController.changePassword(req, res, next)
);

// Update profile route
router.patch(
  "/profile",
  requirePermission(["manage_auth"]),
  validateRequest(updateProfileSchema),
  (req, res, next) => authController.updateProfile(req, res, next)
);

// Deactivate account route (can be used for both self-deactivation and admin deactivation)
router.patch(
  "/deactivate",
  requirePermission(["manage_auth"]),
  (req, res, next) => authController.deactivateAccount(req, res, next)
);

// Create password with token
router.post(
  "/create-password",
  validateRequest(createPasswordSchema),
  (req, res, next) => authController.createPassword(req, res, next)
);

// Request new password creation token
router.post(
  "/request-password-creation",
  validateRequest(requestPasswordCreationSchema),
  (req, res, next) =>
    authController.requestNewPasswordCreationToken(req, res, next)
);

export default router;
