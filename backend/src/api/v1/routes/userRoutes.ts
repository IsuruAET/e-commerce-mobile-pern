import { Router } from "express";

import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  listUsersSchema,
} from "../schemas/userSchema";
import { UserController } from "../controllers/userController";
import { requirePermission } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";

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
  requirePermission(["read_users"]),
  validateRequest(listUsersSchema),
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
  requirePermission(["manage_users"]),
  validateRequest(userIdSchema),
  UserController.deactivateUser
);

// Reactivate user
router.patch(
  "/:id/reactivate",
  requirePermission(["manage_users"]),
  validateRequest(userIdSchema),
  UserController.reactivateUser
);

export default router;
