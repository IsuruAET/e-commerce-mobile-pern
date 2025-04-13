import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/categoryService";

export class CategoryController {
  static async addCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
