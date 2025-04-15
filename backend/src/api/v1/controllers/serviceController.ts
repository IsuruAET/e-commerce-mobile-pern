import { Request, Response, NextFunction } from "express";

import { ServiceService } from "../services/serviceService";

export class ServiceController {
  static async addService(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await ServiceService.createService(req.body);
      res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await ServiceService.getServiceById(id);
      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listActiveServices(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await ServiceService.listActiveServices(req);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAllServices(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await ServiceService.listAllServices(req);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await ServiceService.updateService(id, req.body);
      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ServiceService.deleteService(id);
      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
