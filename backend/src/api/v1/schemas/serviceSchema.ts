import { z } from "zod";

import { imageSchema } from "./shared/imageSchema";

export const serviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  price: z.number().positive(),
  duration: z.number().int().positive().min(30),
  categoryId: z.string().uuid(),
  isActive: z.boolean().default(true),
  images: z.array(imageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be less than 50 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be less than 500 characters"),
    price: z.number().positive("Price must be positive"),
    duration: z
      .number()
      .int("Duration must be an integer")
      .positive("Duration must be positive")
      .min(30, "Duration must be at least 30 minutes"),
    categoryId: z.string().uuid(),
    isActive: z.boolean().default(true),
    images: z.array(imageSchema).min(1),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be less than 50 characters")
      .optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be less than 500 characters")
      .optional(),
    price: z.number().positive("Price must be positive").optional(),
    duration: z
      .number()
      .int("Duration must be an integer")
      .positive("Duration must be positive")
      .min(30, "Duration must be at least 30 minutes")
      .optional(),
    categoryId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    images: z.array(imageSchema).optional(),
  }),
});

export const serviceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type Service = z.infer<typeof serviceSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>["body"];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>["body"];
