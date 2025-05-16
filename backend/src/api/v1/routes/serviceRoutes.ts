import { Router } from "express";

import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  listActiveServicesSchema,
  listServicesSchema,
} from "../schemas/serviceSchema";
import { ServiceController } from "../controllers/serviceController";
import { requirePermission } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";

const router = Router();

// Private routes
router.post(
  "/",
  requirePermission(["create_service"]),
  validateRequest(createServiceSchema),
  ServiceController.createService
);

router.get(
  "/active",
  requirePermission(["read_active_services"]),
  validateRequest(listActiveServicesSchema),
  ServiceController.listActiveServices
);

// Get services for dropdown
router.get(
  "/options",
  requirePermission(["read_services"]),
  ServiceController.getServicesForDropdown
);

router.get(
  "/:id",
  requirePermission(["read_service"]),
  validateRequest(serviceIdSchema),
  ServiceController.getServiceById
);

router.get(
  "/",
  requirePermission(["read_services"]),
  validateRequest(listServicesSchema),
  ServiceController.listAllServices
);

router.put(
  "/:id",
  requirePermission(["update_service"]),
  validateRequest(updateServiceSchema),
  validateRequest(serviceIdSchema),
  ServiceController.updateService
);

router.delete(
  "/:id",
  requirePermission(["delete_service"]),
  validateRequest(serviceIdSchema),
  ServiceController.deleteService
);

router.patch(
  "/:id/deactivate",
  requirePermission(["manage_service"]),
  validateRequest(serviceIdSchema),
  ServiceController.deactivateService
);

router.patch(
  "/:id/reactivate",
  requirePermission(["manage_service"]),
  validateRequest(serviceIdSchema),
  ServiceController.reactivateService
);

export default router;
