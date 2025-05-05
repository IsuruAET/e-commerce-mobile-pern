import { z } from "zod";

export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      name: z
        .string()
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name must be less than 50 characters"),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string(),
      newPassword: z
        .string()
        .min(6, "New password must be at least 6 characters"),
    })
    .strict(),
});

export const forgotPasswordSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email format"),
    })
    .strict(),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string(),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

export const requestPasswordCreationSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email format"),
    })
    .strict(),
});

export const createPasswordSchema = z.object({
  body: z
    .object({
      token: z.string(),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name must be less than 50 characters"),
      phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
        .optional(),
    })
    .strict(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RequestPasswordCreationInput = z.infer<
  typeof requestPasswordCreationSchema
>["body"];
export type CreatePasswordInput = z.infer<typeof createPasswordSchema>["body"];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
