import { z } from "zod";

export const permissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Permission name is required"),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const rolePermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  createdAt: z.date(),
});

export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  permissions: z.array(rolePermissionSchema),
});

export const createRoleSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Role name is required"),
      description: z.string().optional(),
      permissions: z.array(z.string().uuid()),
    })
    .strict(),
});

export const updateRoleSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Role name is required").optional(),
      description: z.string().optional(),
      permissions: z.array(z.string().uuid()).optional(),
    })
    .strict(),
});

export const roleIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type Role = z.infer<typeof roleSchema>;
export type RolePermission = z.infer<typeof rolePermissionSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>["body"];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>["body"];
export type RoleIdParams = z.infer<typeof roleIdSchema>["params"];
