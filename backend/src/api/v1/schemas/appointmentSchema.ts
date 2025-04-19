import { z } from "zod";

const serviceSchema = z.object({
  serviceId: z.string().uuid(),
  numberOfPeople: z.number().int().min(1).default(1),
});

export const createAppointmentSchema = z.object({
  body: z.object({
    stylistId: z.string().uuid(),
    date: z.string().datetime(),
    notes: z.string().optional(),
    services: z.array(serviceSchema),
  }),
});

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    date: z.string().datetime().optional(),
    status: z
      .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"])
      .optional(),
    notes: z.string().optional(),
    services: z.array(serviceSchema).optional(),
  }),
});

export const getAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getAppointmentStatsSchema = z.object({
  query: z.object({
    stylistId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export type CreateAppointmentInput = z.TypeOf<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.TypeOf<typeof updateAppointmentSchema>;
export type GetAppointmentInput = z.TypeOf<typeof getAppointmentSchema>;
export type GetAppointmentStatsInput = z.infer<
  typeof getAppointmentStatsSchema
>;
