import { Router } from "express";

import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentSchema,
  getAppointmentStatsSchema,
  listAppointmentsSchema,
  listUserAppointmentsSchema,
  listStylistAppointmentsSchema,
  updateAppointmentStatusSchema,
} from "../schemas/appointmentSchema";
import { AppointmentController } from "../controllers/appointmentController";
import { requirePermission, requireAuth } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { csrfProtection } from "middleware/csrfHandler";

const router = Router();
const appointmentController = new AppointmentController();

// Private routes
router.post(
  "/",
  csrfProtection,
  requireAuth,
  requirePermission(["create_appointment"]),
  validateRequest(createAppointmentSchema),
  (req, res, next) => appointmentController.createAppointment(req, res, next)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission(["read_appointment"]),
  validateRequest(getAppointmentSchema),
  (req, res, next) => appointmentController.getAppointment(req, res, next)
);

router.put(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["update_appointment"]),
  validateRequest(updateAppointmentSchema),
  (req, res, next) => appointmentController.updateAppointment(req, res, next)
);

router.get(
  "/user/appointments",
  requireAuth,
  requirePermission(["read_user_appointments"]),
  validateRequest(listUserAppointmentsSchema),
  (req, res, next) => appointmentController.getUserAppointments(req, res, next)
);

router.get(
  "/stylist/appointments",
  requireAuth,
  requirePermission(["read_stylist_appointments"]),
  validateRequest(listStylistAppointmentsSchema),
  (req, res, next) =>
    appointmentController.getStylistAppointments(req, res, next)
);

router.get(
  "/stats/income",
  requireAuth,
  requirePermission(["read_appointment_stats"]),
  validateRequest(getAppointmentStatsSchema),
  (req, res, next) => appointmentController.getTotalIncome(req, res, next)
);

router.get(
  "/stats/services",
  requireAuth,
  requirePermission(["read_appointment_stats"]),
  validateRequest(getAppointmentStatsSchema),
  (req, res, next) => appointmentController.getTotalServices(req, res, next)
);

router.get(
  "/",
  requireAuth,
  requirePermission(["read_appointments"]),
  validateRequest(listAppointmentsSchema),
  (req, res, next) => appointmentController.listAppointments(req, res, next)
);

router.get(
  "/user/appointments/:id",
  requireAuth,
  requirePermission(["read_user_appointment"]),
  validateRequest(getAppointmentSchema),
  (req, res, next) =>
    appointmentController.getUserAppointmentById(req, res, next)
);

router.get(
  "/stylist/appointments/:id",
  requireAuth,
  requirePermission(["read_stylist_appointment"]),
  validateRequest(getAppointmentSchema),
  (req, res, next) =>
    appointmentController.getStylistAppointmentById(req, res, next)
);

router.patch(
  "/:id/status",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_appointment"]),
  validateRequest(updateAppointmentStatusSchema),
  (req, res, next) =>
    appointmentController.updateAppointmentStatus(req, res, next)
);

export default router;
