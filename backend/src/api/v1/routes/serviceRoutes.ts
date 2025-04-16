import { Router } from "express";

import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  paginationSchema,
} from "../schemas/serviceSchema";
import { ServiceController } from "../controllers/serviceController";
import { requireRole } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { paginationHandler } from "middleware/paginationHandler";
import { filterHandler } from "middleware/filterHandler";
import { sortHandler } from "middleware/sortHandler";

const router = Router();

// Add service
router.post(
  "/",
  requireRole(["ADMIN"]),
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
  requireRole(["ADMIN"]),
  validateRequest(paginationSchema),
  filterHandler(["categoryId", "isActive"]),
  sortHandler(["name"]),
  paginationHandler,
  ServiceController.listAllServices
);

// Update service
router.put(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(updateServiceSchema),
  validateRequest(serviceIdSchema),
  ServiceController.updateService
);

// Delete service
router.delete(
  "/:id",
  requireRole(["ADMIN"]),
  validateRequest(serviceIdSchema),
  ServiceController.deleteService
);

export default router;
