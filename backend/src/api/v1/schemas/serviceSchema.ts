import { z } from "zod";

const serviceImageSchema = z.object({
  url: z.string().url("Image URL must be a valid URL"),
});

export const createServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Service name must be at least 2 characters long")
      .max(100, "Service name must not exceed 100 characters"),

    description: z
      .string()
      .min(10, "Service description must be at least 10 characters long")
      .max(1000, "Service description must not exceed 1000 characters"),

    price: z
      .number()
      .min(0, "Service price must be greater than or equal to 0"),

    duration: z
      .number()
      .min(5, "Service duration must be at least 5 minutes")
      .max(480, "Service duration must not exceed 8 hours"),

    categoryId: z.string().uuid("Category ID must be a valid UUID"),

    images: z
      .array(serviceImageSchema)
      .min(1, "At least one image is required"),

    isActive: z.boolean().default(true),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Service name must be at least 2 characters long")
      .max(100, "Service name must not exceed 100 characters")
      .optional(),

    description: z
      .string()
      .min(10, "Service description must be at least 10 characters long")
      .max(1000, "Service description must not exceed 1000 characters")
      .optional(),

    price: z
      .number()
      .min(0, "Service price must be greater than or equal to 0")
      .optional(),

    duration: z
      .number()
      .min(5, "Service duration must be at least 5 minutes")
      .max(480, "Service duration must not exceed 8 hours")
      .optional(),

    categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),

    images: z
      .array(serviceImageSchema)
      .min(1, "At least one image is required")
      .optional(),

    isActive: z.boolean().optional(),
  }),
});

export const serviceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid service ID format"),
  }),
});

export type ServiceImage = z.infer<typeof serviceImageSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>["body"];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>["body"];
