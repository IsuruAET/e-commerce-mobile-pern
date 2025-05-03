import { z } from "zod";

import { imageSchema } from "./shared/imageSchema";
import { paginationSchema } from "./shared/paginationSchema";
import { createSortingSchema } from "./shared/sortingSchema";

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  image: imageSchema,
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be less than 50 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be less than 500 characters"),
    image: imageSchema,
    isActive: z.boolean().default(true),
  }),
});

export const updateCategorySchema = z.object({
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
    image: imageSchema.optional(),
    isActive: z.boolean().optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const sortingCategoriesSchema = createSortingSchema(["name"] as const);

export const listCategoriesSchema = z.object({
  query: z
    .object({
      ...paginationSchema.shape,
      isActive: z
        .string()
        .optional()
        .transform((val) => val === "true"),
      ...sortingCategoriesSchema.shape,
    })
    .strict(),
});

export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
