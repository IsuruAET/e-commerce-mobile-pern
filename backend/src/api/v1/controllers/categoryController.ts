import { Request, Response, NextFunction } from "express";

import { CategoryService } from "../services/categoryService";
import { PaginatedResponse } from "utils/queryBuilder";

export class CategoryController {
  private readonly categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await this.categoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        message: "Category added successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategoryById(id);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async listCategories(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const result = await this.categoryService.listCategories(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await this.categoryService.updateCategory(id, req.body);
      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.categoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.categoryService.deactivateCategory(id);
      res.status(200).json({
        success: true,
        message: "Category deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async reactivateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.categoryService.reactivateCategory(id);
      res.status(200).json({
        success: true,
        message: "Category reactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoriesForDropdown(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categories = await this.categoryService.getCategoriesForDropdown();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}
