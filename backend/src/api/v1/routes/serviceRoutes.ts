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
import { requireAuth, requireRole } from "../../../middleware/authHandler";

const router = Router();

// Add service
router.post(
  "/",
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(createServiceSchema),
  ServiceController.addService
);

// List active services
router.get(
  "/active",
  requireAuth,
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
  requireAuth,
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
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(updateServiceSchema),
  validateRequest(serviceIdSchema),
  ServiceController.updateService
);

// Delete service
router.delete(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  validateRequest(serviceIdSchema),
  ServiceController.deleteService
);

export default router;
