import { Router } from "express";

import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from "../schemas/categorySchema";
import { CategoryController } from "../controllers/categoryController";
import { requireRole } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";

const router = Router();

// Add category
router.post(
  "/",
  requireRole(["ADMIN"]),
  validateRequest(createCategorySchema),
  CategoryController.addCategory
);

// Get category by id
router.get(
  "/:id",
  validateRequest(categoryIdSchema),
  CategoryController.getCategoryById
);

// List categories
router.get("/", CategoryController.listCategories);

// Update category
router.put(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(updateCategorySchema),
  validateRequest(categoryIdSchema),
  CategoryController.updateCategory
);

// Delete category
router.delete(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(categoryIdSchema),
  CategoryController.deleteCategory
);

export default router;
