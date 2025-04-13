import { z } from "zod";

// Base image validation schema that can be reused
const imageSchema = z
  .string({
    required_error: "Category image is required",
    invalid_type_error: "Category image must be a string",
  })
  .url("Category image must be a valid URL");

export const categorySchema = z.object({
  name: z
    .string({
      required_error: "Category name is required",
      invalid_type_error: "Category name must be a string",
    })
    .min(2, "Category name must be at least 2 characters long")
    .max(50, "Category name must not exceed 50 characters"),

  description: z
    .string({
      required_error: "Category description is required",
      invalid_type_error: "Category description must be a string",
    })
    .min(10, "Category description must be at least 10 characters long")
    .max(500, "Category description must not exceed 500 characters"),

  image: imageSchema,

  isActive: z.boolean().default(true),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters long")
      .max(50, "Category name must not exceed 50 characters"),

    description: z
      .string()
      .min(10, "Category description must be at least 10 characters long")
      .max(500, "Category description must not exceed 500 characters"),

    image: imageSchema,

    isActive: z.boolean().default(true),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters long")
      .max(50, "Category name must not exceed 50 characters")
      .optional(),

    description: z
      .string()
      .min(10, "Category description must be at least 10 characters long")
      .max(500, "Category description must not exceed 500 characters")
      .optional(),

    image: imageSchema,

    isActive: z.boolean().optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid category ID format"),
  }),
});

export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];
