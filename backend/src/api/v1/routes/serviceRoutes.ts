import { Router } from "express";
import { ServiceController } from "../controllers/serviceController";
import { validateRequest } from "../../../middleware/validateRequest";
import { paginationHandler } from "../../../middleware/paginationHandler";
import { filterHandler } from "../../../middleware/filterHandler";
import { sortHandler } from "../../../middleware/sortHandler";
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  paginationSchema,
} from "../schemas/serviceSchema";

const router = Router();

// Add service
router.post(
  "/",
  validateRequest(createServiceSchema),
  ServiceController.addService
);

// List active services
router.get(
  "/active",
  validateRequest(paginationSchema),
  filterHandler(["categoryId"]),
  paginationHandler,
  ServiceController.listActiveServices
);

// Get service by id
router.get(
  "/:id",
  validateRequest(serviceIdSchema),
  ServiceController.getServiceById
);

// List all services
router.get(
  "/",
  validateRequest(paginationSchema),
  filterHandler(["categoryId", "isActive"]),
  sortHandler(["name"]),
  paginationHandler,
  ServiceController.listAllServices
);

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
