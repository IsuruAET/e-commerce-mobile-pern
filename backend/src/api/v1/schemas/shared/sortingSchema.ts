import { z } from "zod";

export const createSortingSchema = <T extends readonly [string, ...string[]]>(
  enumValues: T
) => {
  return z.object({
    sortBy: z.enum(enumValues).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  });
};

export type SortingInput = z.infer<ReturnType<typeof createSortingSchema>>;
