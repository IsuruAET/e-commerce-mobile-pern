import { Router } from "express";

import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
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
  ServiceController.addService
);

router.get(
  "/active",
  requirePermission(["read_active_services"]),
  ServiceController.listActiveServices
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

export default router;
