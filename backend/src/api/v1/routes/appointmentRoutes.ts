import { Router } from "express";

import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentSchema,
} from "../schemas/appointmentSchema";
import { AppointmentController } from "../controllers/appointmentController";
import { requireAuth, requireRole } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";

const router = Router();
const appointmentController = new AppointmentController();

// All routes require authentication
router.use(requireAuth);

router.post(
  "/",
  validateRequest(createAppointmentSchema),
  appointmentController.createAppointment
);

router.get(
  "/:id",
  validateRequest(getAppointmentSchema),
  appointmentController.getAppointment
);

router.put(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(updateAppointmentSchema),
  appointmentController.updateAppointment
);

router.get("/user/appointments", appointmentController.getUserAppointments);
router.get(
  "/stylist/appointments",
  requireRole(["STYLIST"]),
  appointmentController.getStylistAppointments
);

export default router;
