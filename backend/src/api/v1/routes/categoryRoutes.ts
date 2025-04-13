import { Router } from "express";
import { CategoryController } from "../controllers/categoryController";
import { validateRequest } from "../../../middleware/validateRequest";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from "../schemas/categorySchema";

const router = Router();

// Add category
router.post(
  "/",
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
  validateRequest(updateCategorySchema),
  validateRequest(categoryIdSchema),
  CategoryController.updateCategory
);

// Delete category
router.delete(
  "/:id",
  validateRequest(categoryIdSchema),
  CategoryController.deleteCategory
);

export default router;
