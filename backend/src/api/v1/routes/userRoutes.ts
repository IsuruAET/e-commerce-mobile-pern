import { Router } from "express";
import { UserController } from "../controllers/userController";
import { validateRequest } from "../../../middleware/validateRequest";
import { paginationHandler } from "../../../middleware/paginationHandler";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from "../schemas/userSchema";

const router = Router();

// Create user
router.post("/", validateRequest(createUserSchema), UserController.createUser);

// Get user by id
router.get("/:id", validateRequest(userIdSchema), UserController.getUserById);

// List all users with pagination
router.get("/", paginationHandler, UserController.listUsers);

// Update user
router.put(
  "/:id",
  validateRequest(updateUserSchema),
  validateRequest(userIdSchema),
  UserController.updateUser
);

// Delete user
router.delete("/:id", validateRequest(userIdSchema), UserController.deleteUser);

export default router;
