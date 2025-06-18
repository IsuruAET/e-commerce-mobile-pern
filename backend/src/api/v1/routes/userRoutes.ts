import { Router } from "express";

import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  listUsersSchema,
} from "../schemas/userSchema";
import { UserController } from "../controllers/userController";
import { requirePermission, requireAuth } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { csrfProtection } from "middleware/csrfHandler";

const router = Router();
const userController = new UserController();

// Create user
router.post(
  "/",
  csrfProtection,
  requireAuth,
  requirePermission(["create_user"]),
  validateRequest(createUserSchema),
  (req, res, next) => userController.createUser(req, res, next)
);

// Get user by id
router.get(
  "/:id",
  requireAuth,
  requirePermission(["read_user"]),
  validateRequest(userIdSchema),
  (req, res, next) => userController.getUserById(req, res, next)
);

// List all users with pagination
router.get(
  "/",
  requireAuth,
  requirePermission(["read_users"]),
  validateRequest(listUsersSchema),
  (req, res, next) => userController.listUsers(req, res, next)
);

// Update user
router.put(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["update_user"]),
  validateRequest(updateUserSchema),
  validateRequest(userIdSchema),
  (req, res, next) => userController.updateUser(req, res, next)
);

// Delete user
router.delete(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["delete_user"]),
  validateRequest(userIdSchema),
  (req, res, next) => userController.deleteUser(req, res, next)
);

// Deactivate user
router.patch(
  "/:id/deactivate",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_user"]),
  validateRequest(userIdSchema),
  (req, res, next) => userController.deactivateUser(req, res, next)
);

// Reactivate user
router.patch(
  "/:id/reactivate",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_user"]),
  validateRequest(userIdSchema),
  (req, res, next) => userController.reactivateUser(req, res, next)
);

export default router;
