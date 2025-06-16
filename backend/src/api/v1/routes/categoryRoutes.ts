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
const categoryController = new CategoryController();

// Private routes
router.post(
  "/",
  requirePermission(["create_category"]),
  validateRequest(createCategorySchema),
  (req, res, next) => categoryController.createCategory(req, res, next)
);

// Get categories for dropdown
router.get(
  "/options",
  requirePermission(["read_categories"]),
  (req, res, next) =>
    categoryController.getCategoriesForDropdown(req, res, next)
);

router.get(
  "/",
  requirePermission(["read_categories"]),
  validateRequest(listCategoriesSchema),
  (req, res, next) => categoryController.listCategories(req, res, next)
);

router.get(
  "/:id",
  requirePermission(["read_category"]),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.getCategoryById(req, res, next)
);

router.put(
  "/:id",
  requirePermission(["update_category"]),
  validateRequest(updateCategorySchema),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.updateCategory(req, res, next)
);

router.delete(
  "/:id",
  requirePermission(["delete_category"]),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.deleteCategory(req, res, next)
);

// Deactivate category
router.patch(
  "/:id/deactivate",
  requirePermission(["manage_category"]),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.deactivateCategory(req, res, next)
);

// Reactivate category
router.patch(
  "/:id/reactivate",
  requirePermission(["manage_category"]),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.reactivateCategory(req, res, next)
);

export default router;
