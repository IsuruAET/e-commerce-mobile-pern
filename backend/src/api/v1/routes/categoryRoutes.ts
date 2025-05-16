import { Router } from "express";

import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  listCategoriesSchema,
} from "../schemas/categorySchema";
import { CategoryController } from "../controllers/categoryController";
import { requirePermission } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";

const router = Router();

// Private routes
router.post(
  "/",
  requirePermission(["create_category"]),
  validateRequest(createCategorySchema),
  CategoryController.createCategory
);

// Get categories for dropdown
router.get(
  "/options",
  requirePermission(["read_categories"]),
  CategoryController.getCategoriesForDropdown
);

router.get(
  "/",
  requirePermission(["read_categories"]),
  validateRequest(listCategoriesSchema),
  CategoryController.listCategories
);

router.get(
  "/:id",
  requirePermission(["read_category"]),
  validateRequest(categoryIdSchema),
  CategoryController.getCategoryById
);

router.put(
  "/:id",
  requirePermission(["update_category"]),
  validateRequest(updateCategorySchema),
  validateRequest(categoryIdSchema),
  CategoryController.updateCategory
);

router.delete(
  "/:id",
  requirePermission(["delete_category"]),
  validateRequest(categoryIdSchema),
  CategoryController.deleteCategory
);

// Deactivate category
router.patch(
  "/:id/deactivate",
  requirePermission(["manage_category"]),
  validateRequest(categoryIdSchema),
  CategoryController.deactivateCategory
);

// Reactivate category
router.patch(
  "/:id/reactivate",
  requirePermission(["manage_category"]),
  validateRequest(categoryIdSchema),
  CategoryController.reactivateCategory
);

export default router;
