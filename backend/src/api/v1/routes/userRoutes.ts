import { Router } from "express";

import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  createPasswordSchema,
  requestPasswordCreationSchema,
} from "../schemas/userSchema";
import { paginationSchema } from "../schemas/shared/paginationSchema";
import { UserController } from "../controllers/userController";
import { requirePermission } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { paginationHandler } from "middleware/paginationHandler";

const router = Router();

// Create user
router.post(
  "/",
  requirePermission(["create_user"]),
  validateRequest(createUserSchema),
  UserController.createUser
);

// Get user by id
router.get(
  "/:id",
  requirePermission(["read_user"]),
  validateRequest(userIdSchema),
  UserController.getUserById
);

// List all users with pagination
router.get(
  "/",
  requirePermission(["list_users"]),
  validateRequest(paginationSchema),
  paginationHandler,
  UserController.listUsers
);

// Update user
router.put(
  "/:id",
  requirePermission(["update_user"]),
  validateRequest(updateUserSchema),
  validateRequest(userIdSchema),
  UserController.updateUser
);

// Delete user
router.delete(
  "/:id",
  requirePermission(["delete_user"]),
  validateRequest(userIdSchema),
  UserController.deleteUser
);

// Deactivate user
router.patch(
  "/:id/deactivate",
  requirePermission(["deactivate_user"]),
  validateRequest(userIdSchema),
  UserController.deactivateUser
);

// Reactivate user
router.patch(
  "/:id/reactivate",
  requirePermission(["reactivate_user"]),
  validateRequest(userIdSchema),
  UserController.reactivateUser
);

// Create password with token
router.post(
  "/create-password",
  validateRequest(createPasswordSchema),
  UserController.createPassword
);

// Request new password creation token
router.post(
  "/request-password-creation",
  validateRequest(requestPasswordCreationSchema),
  UserController.requestNewPasswordCreationToken
);

export default router;
