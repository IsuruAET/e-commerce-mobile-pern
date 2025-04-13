import { Router } from "express";
import { validateRequest } from "../../../middleware/validateRequest";
import {
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  registerSchema,
} from "../schemas/authSchema";
import { AuthController } from "../controllers/authController";

const router = Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  AuthController.register
);

router.post("/login", validateRequest(loginSchema), AuthController.login);

router.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  AuthController.refreshToken
);

router.post("/logout", validateRequest(logoutSchema), AuthController.logout);

// Google OAuth routes
router.get("/google", AuthController.googleAuth);
router.get("/google/callback", AuthController.googleCallback);

export default router;
