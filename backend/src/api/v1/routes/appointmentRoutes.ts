import { Router } from "express";

import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentSchema,
  getAppointmentStatsSchema,
  listAppointmentsSchema,
} from "../schemas/appointmentSchema";
import { AppointmentController } from "../controllers/appointmentController";
import { requirePermission } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";

const router = Router();

// Private routes
router.post(
  "/",
  requirePermission(["create_appointment"]),
  validateRequest(createAppointmentSchema),
  AppointmentController.createAppointment
);

router.get(
  "/:id",
  requirePermission(["read_appointment"]),
  validateRequest(getAppointmentSchema),
  AppointmentController.getAppointment
);

router.put(
  "/:id",
  requirePermission(["update_appointment"]),
  validateRequest(updateAppointmentSchema),
  AppointmentController.updateAppointment
);

router.get(
  "/user/appointments",
  requirePermission(["read_user_appointments"]),
  AppointmentController.getUserAppointments
);

router.get(
  "/stylist/appointments",
  requirePermission(["read_stylist_appointments"]),
  AppointmentController.getStylistAppointments
);

router.get(
  "/stats/income",
  requirePermission(["read_appointment_stats"]),
  validateRequest(getAppointmentStatsSchema),
  AppointmentController.getTotalIncome
);

router.get(
  "/stats/services",
  requirePermission(["read_appointment_stats"]),
  validateRequest(getAppointmentStatsSchema),
  AppointmentController.getTotalServices
);

router.get(
  "/",
  requirePermission(["read_appointments"]),
  validateRequest(listAppointmentsSchema),
  AppointmentController.listAppointments
);

export default router;
