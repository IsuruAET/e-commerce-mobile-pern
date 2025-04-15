import { Router } from "express";
import { CategoryController } from "../controllers/categoryController";
import { validateRequest } from "../../../middleware/validateRequest";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from "../schemas/categorySchema";
import { requireAuth, requireRole } from "../../../middleware/authHandler";

const router = Router();

// Add category
router.post(
  "/",
  requireAuth,
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
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(updateCategorySchema),
  validateRequest(categoryIdSchema),
  CategoryController.updateCategory
);

// Delete category
router.delete(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(categoryIdSchema),
  CategoryController.deleteCategory
);

export default router;
