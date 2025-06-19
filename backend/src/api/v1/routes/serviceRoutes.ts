import { Router } from "express";

import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  listActiveServicesSchema,
  listServicesSchema,
} from "../schemas/serviceSchema";
import { ServiceController } from "../controllers/serviceController";
import { requirePermission, requireAuth } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { csrfProtection } from "middleware/csrfHandler";

const router = Router();
const serviceController = new ServiceController();

// Private routes
router.post(
  "/",
  csrfProtection,
  requireAuth,
  requirePermission(["create_service"]),
  validateRequest(createServiceSchema),
  (req, res, next) => serviceController.createService(req, res, next)
);

router.get(
  "/active",
  requireAuth,
  requirePermission(["read_active_services"]),
  validateRequest(listActiveServicesSchema),
  (req, res, next) => serviceController.listActiveServices(req, res, next)
);

// Get services for dropdown
router.get(
  "/options",
  requireAuth,
  requirePermission(["read_services"]),
  (req, res, next) => serviceController.getServicesForDropdown(req, res, next)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission(["read_service"]),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.getServiceById(req, res, next)
);

router.get(
  "/",
  requireAuth,
  requirePermission(["read_services"]),
  validateRequest(listServicesSchema),
  (req, res, next) => serviceController.listAllServices(req, res, next)
);

router.put(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["update_service"]),
  validateRequest(updateServiceSchema),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.updateService(req, res, next)
);

router.delete(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["delete_service"]),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.deleteService(req, res, next)
);

router.patch(
  "/:id/deactivate",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_service"]),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.deactivateService(req, res, next)
);

router.patch(
  "/:id/reactivate",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_service"]),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.reactivateService(req, res, next)
);

export default router;
