import { z } from "zod";
import { paginationSchema } from "./shared/paginationSchema";
import { createSortingSchema } from "./shared/sortingSchema";

const appointmentServiceSchema = z.object({
  serviceId: z.string().uuid(),
  numberOfPeople: z.number().int().min(1).default(1),
});

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  stylistId: z.string().uuid(),
  dateTime: z.date(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().optional(),
  estimatedDuration: z.number().int().positive().min(30),
  totalPrice: z.number().positive(),
  services: z.array(appointmentServiceSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAppointmentSchema = z.object({
  body: z
    .object({
      stylistId: z.string().uuid(),
      dateTime: z.string().datetime(),
      notes: z.string().optional(),
      services: z
        .array(appointmentServiceSchema)
        .min(1, "At least one service is required"),
    })
    .strict(),
});

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      stylistId: z.string().uuid().optional(),
      dateTime: z.string().datetime().optional(),
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
    })
    .strict(),
});

export const getAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const sortingAppointmentsSchema = createSortingSchema([
  "dateTime",
] as const);

export const listAppointmentsSchema = z.object({
  query: z
    .object({
      ...paginationSchema.shape,
      userIds: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",") : [])),

      stylistIds: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",") : [])),

      statuses: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",") : [])),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      ...sortingAppointmentsSchema.shape,
    })
    .strict(),
});

export const listUserAppointmentsSchema = z.object({
  query: z
    .object({
      ...paginationSchema.shape,
      stylistIds: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",") : [])),

      statuses: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",") : [])),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      ...sortingAppointmentsSchema.shape,
    })
    .strict(),
});

export const listStylistAppointmentsSchema = z.object({
  query: z
    .object({
      ...paginationSchema.shape,
      userIds: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",") : [])),

      statuses: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",") : [])),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      ...sortingAppointmentsSchema.shape,
    })
    .strict(),
});

export const getAppointmentStatsSchema = z.object({
  query: z
    .object({
      stylistIds: z
        .string()
        .optional()
        .transform((val) => val?.split(",")),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .strict(),
});

export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type GetAppointmentInput = z.infer<typeof getAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
export type ListUserAppointmentsInput = z.infer<
  typeof listUserAppointmentsSchema
>;
export type ListStylistAppointmentsInput = z.infer<
  typeof listStylistAppointmentsSchema
>;
export type GetAppointmentStatsInput = z.infer<
  typeof getAppointmentStatsSchema
>;
