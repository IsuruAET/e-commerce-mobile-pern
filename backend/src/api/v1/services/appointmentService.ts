import { PrismaClient } from "@prisma/client";

import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../schemas/appointmentSchema";

const prisma = new PrismaClient();

export class AppointmentService {
  async createAppointment(
    input: CreateAppointmentInput["body"],
    userId: string
  ) {
    // First, get all services to calculate total price and duration
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: input.services.map((s) => s.serviceId),
        },
      },
    });

    // Calculate total price and duration based on number of people per service
    const totalPrice = input.services.reduce((sum, serviceInput) => {
      const service = services.find((s) => s.id === serviceInput.serviceId);
      return sum + (Number(service?.price) || 0) * serviceInput.numberOfPeople;
    }, 0);

    const estimatedDuration = services.reduce(
      (sum, service) => sum + service.duration,
      0
    );

    return prisma.appointment.create({
      data: {
        userId,
        stylistId: input.stylistId,
        date: new Date(input.date),
        notes: input.notes,
        estimatedDuration,
        totalPrice,
        services: {
          create: input.services.map((serviceInput) => ({
            serviceId: serviceInput.serviceId,
            numberOfPeople: serviceInput.numberOfPeople,
          })),
        },
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getAppointment(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateAppointment(id: string, input: UpdateAppointmentInput["body"]) {
    let updateData: any = {
      date: input.date ? new Date(input.date) : undefined,
      status: input.status,
      notes: input.notes,
    };

    if (input.services) {
      // Get all services to calculate new total price and duration
      const services = await prisma.service.findMany({
        where: {
          id: {
            in: input.services.map((s) => s.serviceId),
          },
        },
      });

      // Calculate total price and duration based on number of people per service
      const totalPrice = input.services.reduce((sum, serviceInput) => {
        const service = services.find((s) => s.id === serviceInput.serviceId);
        return (
          sum + (Number(service?.price) || 0) * serviceInput.numberOfPeople
        );
      }, 0);

      const estimatedDuration = services.reduce(
        (sum, service) => sum + service.duration,
        0
      );

      updateData = {
        ...updateData,
        totalPrice,
        estimatedDuration,
        services: {
          deleteMany: {},
          create: input.services.map((serviceInput) => ({
            serviceId: serviceInput.serviceId,
            numberOfPeople: serviceInput.numberOfPeople,
          })),
        },
      };
    }

    return prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        services: {
          include: {
            service: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getUserAppointments(userId: string) {
    return prisma.appointment.findMany({
      where: { userId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });
  }

  async getStylistAppointments(stylistId: string) {
    return prisma.appointment.findMany({
      where: { stylistId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });
  }
}
