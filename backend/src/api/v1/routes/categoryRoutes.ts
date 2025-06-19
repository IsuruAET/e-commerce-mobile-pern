import { Router } from "express";

import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  listCategoriesSchema,
} from "../schemas/categorySchema";
import { CategoryController } from "../controllers/categoryController";
import { requirePermission, requireAuth } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { csrfProtection } from "middleware/csrfHandler";

const router = Router();
const categoryController = new CategoryController();

// Private routes
router.post(
  "/",
  csrfProtection,
  requireAuth,
  requirePermission(["create_category"]),
  validateRequest(createCategorySchema),
  (req, res, next) => categoryController.createCategory(req, res, next)
);

// Get categories for dropdown
router.get(
  "/options",
  requireAuth,
  requirePermission(["read_categories"]),
  (req, res, next) =>
    categoryController.getCategoriesForDropdown(req, res, next)
);

router.get(
  "/",
  requireAuth,
  requirePermission(["read_categories"]),
  validateRequest(listCategoriesSchema),
  (req, res, next) => categoryController.listCategories(req, res, next)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission(["read_category"]),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.getCategoryById(req, res, next)
);

router.put(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["update_category"]),
  validateRequest(updateCategorySchema),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.updateCategory(req, res, next)
);

router.delete(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["delete_category"]),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.deleteCategory(req, res, next)
);

// Deactivate category
router.patch(
  "/:id/deactivate",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_category"]),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.deactivateCategory(req, res, next)
);

// Reactivate category
router.patch(
  "/:id/reactivate",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_category"]),
  validateRequest(categoryIdSchema),
  (req, res, next) => categoryController.reactivateCategory(req, res, next)
);

export default router;
