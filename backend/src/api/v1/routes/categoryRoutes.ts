import { Router } from "express";
import { CategoryController } from "../controllers/categoryController";
import { validateRequest } from "../../../middleware/validateRequest";
import { createCategorySchema } from "../schemas/categorySchema";

const router = Router();

// Add category
router.post(
  "/",
  validateRequest(createCategorySchema),
  CategoryController.addCategory
);

// Delete category
router.delete("/:id", CategoryController.deleteCategory);

export default router;
