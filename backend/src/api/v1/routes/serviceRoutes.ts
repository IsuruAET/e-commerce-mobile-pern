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
const serviceController = new ServiceController();

// Private routes
router.post(
  "/",
  requirePermission(["create_service"]),
  validateRequest(createServiceSchema),
  (req, res, next) => serviceController.createService(req, res, next)
);

router.get(
  "/active",
  requirePermission(["read_active_services"]),
  validateRequest(listActiveServicesSchema),
  (req, res, next) => serviceController.listActiveServices(req, res, next)
);

// Get services for dropdown
router.get("/options", requirePermission(["read_services"]), (req, res, next) =>
  serviceController.getServicesForDropdown(req, res, next)
);

router.get(
  "/:id",
  requirePermission(["read_service"]),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.getServiceById(req, res, next)
);

router.get(
  "/",
  requirePermission(["read_services"]),
  validateRequest(listServicesSchema),
  (req, res, next) => serviceController.listAllServices(req, res, next)
);

router.put(
  "/:id",
  requirePermission(["update_service"]),
  validateRequest(updateServiceSchema),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.updateService(req, res, next)
);

router.delete(
  "/:id",
  requirePermission(["delete_service"]),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.deleteService(req, res, next)
);

router.patch(
  "/:id/deactivate",
  requirePermission(["manage_service"]),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.deactivateService(req, res, next)
);

router.patch(
  "/:id/reactivate",
  requirePermission(["manage_service"]),
  validateRequest(serviceIdSchema),
  (req, res, next) => serviceController.reactivateService(req, res, next)
);

export default router;
