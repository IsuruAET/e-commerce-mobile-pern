import { z } from "zod";

const appointmentServiceSchema = z.object({
  serviceId: z.string().uuid(),
  numberOfPeople: z.number().int().min(1).default(1),
});

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  stylistId: z.string().uuid(),
  date: z.date(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().optional(),
  estimatedDuration: z.number().int().positive().min(30),
  totalPrice: z.number().positive(),
  services: z.array(appointmentServiceSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAppointmentSchema = z.object({
  body: z.object({
    stylistId: z.string().uuid(),
    date: z.string().datetime(),
    notes: z.string().optional(),
    services: z
      .array(appointmentServiceSchema)
      .min(1, "At least one service is required"),
  }),
});

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    date: z.string().datetime().optional(),
    status: z
      .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"], {
        errorMap: () => ({
          message: "Invalid status",
        }),
      })
      .optional(),
    notes: z.string().optional(),
    services: z
      .array(appointmentServiceSchema)
      .min(1, "At least one service is required")
      .optional(),
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

export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointmentInput = z.TypeOf<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.TypeOf<typeof updateAppointmentSchema>;
export type GetAppointmentInput = z.TypeOf<typeof getAppointmentSchema>;
export type GetAppointmentStatsInput = z.infer<
  typeof getAppointmentStatsSchema
>;
