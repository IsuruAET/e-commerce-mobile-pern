import { Router } from "express";

import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentSchema,
  getAppointmentStatsSchema,
  CreateAppointmentInput,
} from "../schemas/appointmentSchema";
import { AppointmentController } from "../controllers/appointmentController";
import { requireRole } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { filterHandler } from "middleware/filterHandler";
import { withAuth } from "middleware/authHandler";

const router = Router();

// Private routes
router.post(
  "/",
  validateRequest(createAppointmentSchema),
  withAuth<{}, CreateAppointmentInput["body"]>(
    AppointmentController.createAppointment
  )
);

router.get(
  "/:id",
  validateRequest(getAppointmentSchema),
  AppointmentController.getAppointment
);

router.put(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(updateAppointmentSchema),
  AppointmentController.updateAppointment
);

router.get(
  "/user/appointments",
  withAuth(AppointmentController.getUserAppointments)
);

router.get(
  "/stylist/appointments",
  requireRole(["STYLIST"]),
  withAuth(AppointmentController.getStylistAppointments)
);

router.get(
  "/stats/income",
  requireRole(["ADMIN"]),
  validateRequest(getAppointmentStatsSchema),
  filterHandler(["stylistId", "startDate", "endDate"]),
  AppointmentController.getTotalIncome
);

router.get(
  "/stats/services",
  requireRole(["ADMIN"]),
  validateRequest(getAppointmentStatsSchema),
  filterHandler(["stylistId", "startDate", "endDate"]),
  AppointmentController.getTotalServices
);

export default router;
