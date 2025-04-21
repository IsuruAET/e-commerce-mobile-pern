import { Router } from "express";

import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from "../schemas/userSchema";
import { paginationSchema } from "../schemas/shared/paginationSchema";
import { UserController } from "../controllers/userController";
import { requireRole } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { paginationHandler } from "middleware/paginationHandler";

const router = Router();

// Create user
router.post(
  "/",
  requireRole(["ADMIN"]),
  validateRequest(createUserSchema),
  UserController.createUser
);

// Get user by id
router.get(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(userIdSchema),
  UserController.getUserById
);

// List all users with pagination
router.get(
  "/",
  requireRole(["ADMIN"]),
  validateRequest(paginationSchema),
  paginationHandler,
  UserController.listUsers
);

// Update user
router.put(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(updateUserSchema),
  validateRequest(userIdSchema),
  UserController.updateUser
);

// Delete user
router.delete(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(userIdSchema),
  UserController.deleteUser
);

// Deactivate user
router.patch(
  "/:id/deactivate",
  requireRole(["ADMIN"]),
  validateRequest(userIdSchema),
  UserController.deactivateUser
);

// Reactivate user
router.patch(
  "/:id/reactivate",
  requireRole(["ADMIN"]),
  validateRequest(userIdSchema),
  UserController.reactivateUser
);

export default router;
