import { Request, Response, NextFunction } from "express";

import { ServiceService } from "../services/serviceService";
import { PaginatedResponse } from "utils/queryBuilder";

export class ServiceController {
  private readonly serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await this.serviceService.createService(req.body);
      res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await this.serviceService.getServiceById(id);
      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  async listActiveServices(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const result = await this.serviceService.listActiveServices(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listAllServices(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const result = await this.serviceService.listAllServices(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await this.serviceService.updateService(id, req.body);
      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.serviceService.deleteService(id);
      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getServicesForDropdown(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const services = await this.serviceService.getServicesForDropdown();
      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.serviceService.deactivateService(id);
      res.status(200).json({
        success: true,
        message: "Service deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async reactivateService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.serviceService.reactivateService(id);
      res.status(200).json({
        success: true,
        message: "Service reactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
