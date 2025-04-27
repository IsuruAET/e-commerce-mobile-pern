import { z } from "zod";

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

export const createPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const requestPasswordCreationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
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

export const listUsersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default("1"),
    count: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default("10"),
    roleIds: z
      .string()
      .optional()
      .transform((val) => val?.split(",")),
    isDeactivated: z
      .string()
      .optional()
      .transform((val) => val === "true"),
    sortBy: z
      .string()
      .transform((val) => val.split(","))
      .optional(),
    sortOrder: z
      .string()
      .transform((val) => val.split(","))
      .optional()
      .default("asc"),
  }),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type CreatePasswordInput = z.infer<typeof createPasswordSchema>["body"];
export type RequestPasswordCreationInput = z.infer<
  typeof requestPasswordCreationSchema
>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
export type UserIdParams = z.infer<typeof userIdSchema>["params"];
export type ListUsersInput = z.infer<typeof listUsersSchema>;
