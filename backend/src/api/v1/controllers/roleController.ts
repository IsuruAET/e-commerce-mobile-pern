import { Request, Response, NextFunction } from "express";

import { RoleService } from "../services/roleService";

export class RoleController {
  static async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, permissions } = req.body;
      const role = await RoleService.createRole({
        name,
        description,
        permissions,
      });
      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await RoleService.getAllRoles();
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await RoleService.getRole(id);
      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      const role = await RoleService.updateRole(id, {
        name,
        description,
        permissions,
      });
      res.status(200).json({
        success: true,
        message: "Role updated successfully",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await RoleService.deleteRole(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async listPermissions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const permissions = await RoleService.getAllPermissions();
      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }
}
