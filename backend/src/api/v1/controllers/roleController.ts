import { Request, Response, NextFunction } from "express";
import { RoleService } from "../services/roleService";

export class RoleController {
  private readonly roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, permissions } = req.body;
      const role = await this.roleService.createRole({
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

  async listRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await this.roleService.getAllRoles();
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await this.roleService.getRole(id);
      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      const role = await this.roleService.updateRole(id, {
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

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.roleService.deleteRole(id);
      res.status(200).json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async listPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await this.roleService.getAllPermissions();
      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRolesForDropdown(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await this.roleService.getRolesForDropdown();
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }
}
