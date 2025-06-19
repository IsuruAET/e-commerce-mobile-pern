import { Router } from "express";
import { RoleController } from "../controllers/roleController";
import { requirePermission, requireAuth } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
import { csrfProtection } from "middleware/csrfHandler";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
} from "../schemas/roleSchema";

const router = Router();
const roleController = new RoleController();

// Create role
router.post(
  "/",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_roles"]),
  validateRequest(createRoleSchema),
  (req, res, next) => roleController.createRole(req, res, next)
);

// List all roles
router.get(
  "/",
  requireAuth,
  requirePermission(["manage_roles"]),
  (req, res, next) => roleController.listRoles(req, res, next)
);

// List all permissions
router.get(
  "/permissions",
  requireAuth,
  requirePermission(["manage_roles"]),
  (req, res, next) => roleController.listPermissions(req, res, next)
);

// Get roles for dropdown
router.get(
  "/options",
  requireAuth,
  requirePermission(["manage_roles"]),
  (req, res, next) => roleController.getRolesForDropdown(req, res, next)
);

// Get role by id
router.get(
  "/:id",
  requireAuth,
  requirePermission(["manage_roles"]),
  validateRequest(roleIdSchema),
  (req, res, next) => roleController.getRoleById(req, res, next)
);

// Update role
router.put(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_roles"]),
  validateRequest(updateRoleSchema),
  validateRequest(roleIdSchema),
  (req, res, next) => roleController.updateRole(req, res, next)
);

// Delete role
router.delete(
  "/:id",
  csrfProtection,
  requireAuth,
  requirePermission(["manage_roles"]),
  validateRequest(roleIdSchema),
  (req, res, next) => roleController.deleteRole(req, res, next)
);

export default router;
