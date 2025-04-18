import { Request, Response } from "express";
import { AuthRequest } from "middleware/authHandler";

import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  GetAppointmentInput,
} from "../schemas/appointmentSchema";
import { AppointmentService } from "../services/appointmentService";

export class AppointmentController {
  static async createAppointment(
    req: AuthRequest<{}, {}, CreateAppointmentInput["body"]>,
    res: Response
  ) {
    try {
      const appointment = await AppointmentService.createAppointment(
        req.body,
        req.auth!.userId
      );
      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAppointment(
    req: Request<GetAppointmentInput["params"]>,
    res: Response
  ) {
    try {
      const appointment = await AppointmentService.getAppointment(
        req.params.id
      );
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateAppointment(
    req: Request<
      UpdateAppointmentInput["params"],
      {},
      UpdateAppointmentInput["body"]
    >,
    res: Response
  ) {
    try {
      const appointment = await AppointmentService.updateAppointment(
        req.params.id,
        req.body
      );
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserAppointments(req: AuthRequest, res: Response) {
    try {
      const appointments = await AppointmentService.getUserAppointments(
        req.auth!.userId
      );
      res.json(appointments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStylistAppointments(req: AuthRequest, res: Response) {
    try {
      const appointments = await AppointmentService.getStylistAppointments(
        req.auth!.userId
      );
      res.json(appointments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
