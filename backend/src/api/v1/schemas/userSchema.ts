import { z } from "zod";
import { paginationSchema } from "./shared/paginationSchema";
import { createSortingSchema } from "./shared/sortingSchema";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().nullable(),
  name: z.string(),
  phone: z.string().nullable(),
  roleId: z.string().uuid(),
  googleId: z.string().nullable(),
  isDeactivated: z.boolean().default(false),
  deactivatedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(1, "Name is required"),
    phone: z.string().optional(),
    roleId: z.string().uuid("Invalid role ID"),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").optional(),
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be less than 50 characters")
      .optional(),
    phone: z.string().optional(),
    roleId: z.string().uuid("Invalid role ID").optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const sortingUsersSchema = createSortingSchema(["name"] as const);

export const listUsersSchema = z.object({
  query: z.object({
    ...paginationSchema.shape,
    roleIds: z
      .string()
      .optional()
      .transform((val) => val?.split(",")),
    isDeactivated: z
      .string()
      .optional()
      .transform((val) => val === "true"),
    ...sortingUsersSchema.shape,
  }),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
export type UserIdParams = z.infer<typeof userIdSchema>["params"];
export type ListUsersInput = z.infer<typeof listUsersSchema>;
