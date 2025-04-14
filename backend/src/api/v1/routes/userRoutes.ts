import { Router } from "express";
import { UserController } from "../controllers/userController";
import { validateRequest } from "../../../middleware/validateRequest";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  paginationSchema,
} from "../schemas/userSchema";

const router = Router();

// Create user
router.post("/", validateRequest(createUserSchema), UserController.createUser);

// Get user by id
router.get("/:id", validateRequest(userIdSchema), UserController.getUserById);

// List all users
router.get("/", validateRequest(paginationSchema), UserController.listUsers);

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
