import { Request, Response, NextFunction } from "express";

import { GetAppointmentStatsInput } from "../schemas/appointmentSchema";
import { AppointmentService } from "../services/appointmentService";
import { PaginatedResponse } from "utils/queryBuilder";

export class AppointmentController {
  static async createAppointment(
    req: Request,
    res: Response<{ success: boolean; message: string; data: any }>,
    next: NextFunction
  ) {
    try {
      const userId = req.auth?.userId as string;
      const appointment = await AppointmentService.createAppointment(
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

  static async getAppointment(
    req: Request,
    res: Response<{ success: boolean; message?: string; data?: any }>,
    next: NextFunction
  ) {
    try {
      const appointment = await AppointmentService.getAppointment(
        req.params.id
      );
      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAppointment(
    req: Request,
    res: Response<{ success: boolean; message: string; data: any }>,
    next: NextFunction
  ) {
    try {
      const appointment = await AppointmentService.updateAppointment(
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

  static async getUserAppointments(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const userId = req.auth?.userId as string;
      const result = await AppointmentService.getUserAppointments(
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

  static async getStylistAppointments(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const userId = req.auth?.userId as string;
      const stylistId = req.auth?.userId as string;
      const result = await AppointmentService.getStylistAppointments(
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

  static async getTotalIncome(
    req: Request<{}, {}, {}, GetAppointmentStatsInput["query"]>,
    res: Response<{ success: boolean; data: { totalIncome: number } }>,
    next: NextFunction
  ) {
    try {
      const { stylistIds, startDate, endDate } = req.query;
      const totalIncome = await AppointmentService.getTotalIncome(
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

  static async getTotalServices(
    req: Request<{}, {}, {}, GetAppointmentStatsInput["query"]>,
    res: Response<{ success: boolean; data: { totalServices: number } }>,
    next: NextFunction
  ) {
    try {
      const { stylistIds, startDate, endDate } = req.query;
      const totalServices = await AppointmentService.getTotalServices(
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

  static async listAppointments(
    req: Request,
    res: Response<{ success: boolean; data: PaginatedResponse<any> }>,
    next: NextFunction
  ) {
    try {
      const result = await AppointmentService.listAppointments(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
