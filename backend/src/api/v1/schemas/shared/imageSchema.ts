import { z } from "zod";

export const imageSchema = z.string().url();
