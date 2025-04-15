import { Router } from "express";

import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from "../schemas/userSchema";
import { UserController } from "../controllers/userController";
import { requireAuth, requireRole } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { paginationHandler } from "middleware/paginationHandler";

const router = Router();

// Create user
router.post(
  "/",
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(createUserSchema),
  UserController.createUser
);

// Get user by id
router.get(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(userIdSchema),
  UserController.getUserById
);

// List all users with pagination
router.get(
  "/",
  requireAuth,
  requireRole(["ADMIN"]),
  paginationHandler,
  UserController.listUsers
);

// Update user
router.put(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(updateUserSchema),
  validateRequest(userIdSchema),
  UserController.updateUser
);

// Delete user
router.delete(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(userIdSchema),
  UserController.deleteUser
);

export default router;
