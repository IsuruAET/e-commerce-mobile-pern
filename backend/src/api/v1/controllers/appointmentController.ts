import { Request, Response, NextFunction } from "express";

import { GetAppointmentStatsInput } from "../schemas/appointmentSchema";
import { AppointmentService } from "../services/appointmentService";
import { PaginatedResponse } from "utils/queryBuilder";

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  async createAppointment(
    req: Request,
    res: Response<{ success: boolean; message: string; data: any }>,
    next: NextFunction
  ) {
    try {
      const userId = req.auth?.userId as string;
      const appointment = await this.appointmentService.createAppointment(
        req.body,
        userId
      );
      res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await this.appointmentService.getAppointment(
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAppointment(
    req: Request,
    res: Response<{ success: boolean; message: string; data: any }>,
    next: NextFunction
  ) {
    try {
      const appointment = await this.appointmentService.updateAppointment(
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Appointment updated successfully",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserAppointments(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const userId = req.auth?.userId as string;
      const result = await this.appointmentService.getUserAppointments(
        userId,
        req.query
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStylistAppointments(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const stylistId = req.auth?.userId as string;
      const result = await this.appointmentService.getStylistAppointments(
        stylistId,
        req.query
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTotalIncome(
    req: Request<{}, {}, {}, GetAppointmentStatsInput["query"]>,
    res: Response<{ success: boolean; data: { totalIncome: number } }>,
    next: NextFunction
  ) {
    try {
      const { stylistIds, startDate, endDate } = req.query;
      const totalIncome = await this.appointmentService.getTotalIncome(
        stylistIds,
        startDate,
        endDate
      );
      res.status(200).json({
        success: true,
        data: { totalIncome },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTotalServices(
    req: Request<{}, {}, {}, GetAppointmentStatsInput["query"]>,
    res: Response<{ success: boolean; data: { totalServices: number } }>,
    next: NextFunction
  ) {
    try {
      const { stylistIds, startDate, endDate } = req.query;
      const totalServices = await this.appointmentService.getTotalServices(
        stylistIds,
        startDate,
        endDate
      );
      res.status(200).json({
        success: true,
        data: { totalServices },
      });
    } catch (error) {
      next(error);
    }
  }

  async listAppointments(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const result = await this.appointmentService.listAppointments(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserAppointmentById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.auth?.userId as string;
      const appointment = await this.appointmentService.getUserAppointmentById(
        req.params.id,
        userId
      );
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStylistAppointmentById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stylistId = req.auth?.userId as string;
      const appointment =
        await this.appointmentService.getStylistAppointmentById(
          req.params.id,
          stylistId
        );
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAppointmentStatus(
    req: Request,
    res: Response<{ success: boolean; message: string; data: any }>,
    next: NextFunction
  ) {
    try {
      const appointment = await this.appointmentService.updateAppointmentStatus(
        req.params.id,
        req.body.status
      );
      res.status(200).json({
        success: true,
        message: "Appointment status updated successfully",
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
}
