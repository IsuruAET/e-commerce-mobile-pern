import { Router } from "express";
import { ServiceController } from "../controllers/serviceController";
import { validateRequest } from "../../../middleware/validateRequest";
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
} from "../schemas/serviceSchema";

const router = Router();

// Add service
router.post(
  "/",
  validateRequest(createServiceSchema),
  ServiceController.addService
);

// Get service by id
router.get(
  "/:id",
  validateRequest(serviceIdSchema),
  ServiceController.getServiceById
);

// List active services
router.get("/active", ServiceController.listActiveServices);

// List all services
router.get("/", ServiceController.listAllServices);

// Update service
router.put(
  "/:id",
  validateRequest(updateServiceSchema),
  validateRequest(serviceIdSchema),
  ServiceController.updateService
);

// Delete service
router.delete(
  "/:id",
  validateRequest(serviceIdSchema),
  ServiceController.deleteService
);

export default router;
