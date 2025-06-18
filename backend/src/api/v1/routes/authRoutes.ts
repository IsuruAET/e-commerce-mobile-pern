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
import { requirePermission, requireAuth } from "middleware/authHandler";
import { csrfProtection } from "middleware/csrfHandler";

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
  "/register",
  csrfProtection,
  validateRequest(registerSchema),
  (req, res, next) => authController.register(req, res, next)
);

router.post(
  "/login",
  csrfProtection,
  validateRequest(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);

router.post("/refresh-token", csrfProtection, (req, res, next) =>
  authController.refreshToken(req, res, next)
);

router.post("/logout", csrfProtection, requireAuth, (req, res, next) =>
  authController.logout(req, res, next)
);

// Get CSRF token
router.get("/csrf-token", (req, res, next) =>
  authController.getCsrfToken(req, res, next)
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
  csrfProtection,
  validateRequest(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

router.post(
  "/reset-password",
  csrfProtection,
  validateRequest(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

// Private routes
router.post(
  "/change-password",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_auth"]),
  validateRequest(changePasswordSchema),
  (req, res, next) => authController.changePassword(req, res, next)
);

// Update profile route
router.patch(
  "/profile",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_auth"]),
  validateRequest(updateProfileSchema),
  (req, res, next) => authController.updateProfile(req, res, next)
);

// Deactivate account route (can be used for both self-deactivation and admin deactivation)
router.patch(
  "/deactivate",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_auth"]),
  (req, res, next) => authController.deactivateAccount(req, res, next)
);

// Create password with token
router.post(
  "/create-password",
  csrfProtection,
  validateRequest(createPasswordSchema),
  (req, res, next) => authController.createPassword(req, res, next)
);

// Request new password creation token
router.post(
  "/request-password-creation",
  csrfProtection,
  validateRequest(requestPasswordCreationSchema),
  (req, res, next) =>
    authController.requestNewPasswordCreationToken(req, res, next)
);

export default router;
