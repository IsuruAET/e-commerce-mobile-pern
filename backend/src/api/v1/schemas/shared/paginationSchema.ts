import { z } from "zod";

const MAX_PAGE_SIZE = 100;

export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("1")
    .refine((val) => val >= 1, {
      message: "Page number must be greater than 0",
    }),
  count: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("10")
    .refine((val) => val >= 1, {
      message: "Count must be greater than 0",
    })
    .refine((val) => val <= MAX_PAGE_SIZE, {
      message: `Count cannot exceed ${MAX_PAGE_SIZE}`,
    }),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
