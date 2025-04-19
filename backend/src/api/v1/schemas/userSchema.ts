import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3).max(50),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "USER", "STYLIST"]),
  googleId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be less than 50 characters"),
    phone: z.string().optional(),
    role: z
      .enum(["ADMIN", "USER", "STYLIST"], {
        errorMap: () => ({
          message: "Invalid role",
        }),
      })
      .default("USER"),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be less than 50 characters")
      .optional(),
    phone: z.string().optional(),
    role: z
      .enum(["ADMIN", "USER", "STYLIST"], {
        errorMap: () => ({
          message: "Invalid role",
        }),
      })
      .optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
