import { Request, Response, NextFunction } from "express";

import { UserService } from "../services/userService";
import { PaginatedResponse } from "utils/queryBuilder";

export class UserController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const result = await UserService.listUsers(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.updateUser(id, req.body);
      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UserService.deactivateUser(id);
      res.status(200).json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async reactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UserService.reactivateUser(id);
      res.status(200).json({
        success: true,
        message: "User reactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
