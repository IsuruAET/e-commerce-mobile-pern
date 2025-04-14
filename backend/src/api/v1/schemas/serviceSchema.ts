import { z } from "zod";

// Base image validation schema that can be reused
const imageSchema = z
  .string({
    required_error: "Service image is required",
    invalid_type_error: "Service image must be a string",
  })
  .url("Service image must be a valid URL");

export const serviceSchema = z.object({
  name: z
    .string({
      required_error: "Service name is required",
      invalid_type_error: "Service name must be a string",
    })
    .min(2, "Service name must be at least 2 characters long")
    .max(50, "Service name must not exceed 50 characters"),

  description: z
    .string({
      required_error: "Service description is required",
      invalid_type_error: "Service description must be a string",
    })
    .min(10, "Service description must be at least 10 characters long")
    .max(500, "Service description must not exceed 500 characters"),

  price: z
    .number({
      required_error: "Service price is required",
      invalid_type_error: "Service price must be a number",
    })
    .positive("Service price must be a positive number"),

  duration: z
    .number({
      required_error: "Service duration is required",
      invalid_type_error: "Service duration must be a number",
    })
    .int("Service duration must be an integer")
    .positive("Service duration must be a positive number"),

  categoryId: z.string().uuid("Invalid category ID format"),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const createServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Service name must be at least 2 characters long")
      .max(50, "Service name must not exceed 50 characters"),

    description: z
      .string()
      .min(10, "Service description must be at least 10 characters long")
      .max(500, "Service description must not exceed 500 characters"),

    price: z.number().positive("Service price must be a positive number"),
    duration: z
      .number()
      .int()
      .positive("Service duration must be a positive integer"),
    categoryId: z.string().uuid("Invalid category ID format"),
    isActive: z.boolean().default(true),
    images: z.array(imageSchema).min(1, "At least one image is required"),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Service name must be at least 2 characters long")
      .max(50, "Service name must not exceed 50 characters")
      .optional(),

    description: z
      .string()
      .min(10, "Service description must be at least 10 characters long")
      .max(500, "Service description must not exceed 500 characters")
      .optional(),

    price: z
      .number()
      .positive("Service price must be a positive number")
      .optional(),
    duration: z
      .number()
      .int()
      .positive("Service duration must be a positive integer")
      .optional(),
    categoryId: z.string().uuid("Invalid category ID format").optional(),
    isActive: z.boolean().optional(),
    images: z.array(imageSchema).optional(),
  }),
});

export const serviceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid service ID format"),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export type Service = z.infer<typeof serviceSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>["body"];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>["body"];
export type PaginationInput = z.infer<typeof paginationSchema>["query"];
