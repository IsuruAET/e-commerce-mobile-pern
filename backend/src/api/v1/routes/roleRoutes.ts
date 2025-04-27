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

// Create role
router.post(
  "/",
  requirePermission(["manage_roles"]),
  validateRequest(createRoleSchema),
  RoleController.createRole
);

// List all roles
router.get("/", requirePermission(["manage_roles"]), RoleController.listRoles);

// List all permissions
router.get(
  "/permissions",
  requirePermission(["manage_roles"]),
  RoleController.listPermissions
);

// Get role by id
router.get(
  "/:id",
  requirePermission(["manage_roles"]),
  validateRequest(roleIdSchema),
  RoleController.getRoleById
);

// Update role
router.put(
  "/:id",
  requirePermission(["manage_roles"]),
  validateRequest(updateRoleSchema),
  validateRequest(roleIdSchema),
  RoleController.updateRole
);

// Delete role
router.delete(
  "/:id",
  requirePermission(["manage_roles"]),
  validateRequest(roleIdSchema),
  RoleController.deleteRole
);

export default router;
