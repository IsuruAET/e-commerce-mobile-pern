import { Router } from "express";

import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentSchema,
  getAppointmentStatsSchema,
} from "../schemas/appointmentSchema";
import { AppointmentController } from "../controllers/appointmentController";
import { requireAuth, requireRole } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { filterHandler } from "middleware/filterHandler";

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.post(
  "/",
  validateRequest(createAppointmentSchema),
  AppointmentController.createAppointment
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

router.get("/user/appointments", AppointmentController.getUserAppointments);
router.get(
  "/stylist/appointments",
  requireRole(["STYLIST"]),
  AppointmentController.getStylistAppointments
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
