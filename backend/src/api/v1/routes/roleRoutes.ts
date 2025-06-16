import { Router } from "express";
import { RoleController } from "../controllers/roleController";
import { requirePermission } from "middleware/authHandler";
import { validateRequest } from "middleware/validateRequest";
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
  requirePermission(["manage_roles"]),
  validateRequest(createRoleSchema),
  (req, res, next) => roleController.createRole(req, res, next)
);

// List all roles
router.get("/", requirePermission(["manage_roles"]), (req, res, next) =>
  roleController.listRoles(req, res, next)
);

// List all permissions
router.get(
  "/permissions",
  requirePermission(["manage_roles"]),
  (req, res, next) => roleController.listPermissions(req, res, next)
);

// Get roles for dropdown
router.get("/options", requirePermission(["manage_roles"]), (req, res, next) =>
  roleController.getRolesForDropdown(req, res, next)
);

// Get role by id
router.get(
  "/:id",
  requirePermission(["manage_roles"]),
  validateRequest(roleIdSchema),
  (req, res, next) => roleController.getRoleById(req, res, next)
);

// Update role
router.put(
  "/:id",
  requirePermission(["manage_roles"]),
  validateRequest(updateRoleSchema),
  validateRequest(roleIdSchema),
  (req, res, next) => roleController.updateRole(req, res, next)
);

// Delete role
router.delete(
  "/:id",
  requirePermission(["manage_roles"]),
  validateRequest(roleIdSchema),
  (req, res, next) => roleController.deleteRole(req, res, next)
);

export default router;
