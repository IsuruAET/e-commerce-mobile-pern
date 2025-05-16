import {
  PrismaClient,
  Service,
  ServiceImage,
  Category,
  Prisma,
  AppointmentService,
  Appointment,
} from "@prisma/client";

// Define a type for the Prisma transaction
export type PrismaTransaction = Prisma.TransactionClient;

export interface IServiceRepository {
  // Service operations
  createService(
    data: {
      name: string;
      description: string;
      price: number;
      duration: number;
      categoryId: string;
      isActive: boolean;
    },
    tx?: PrismaTransaction
  ): Promise<Service>;

  findServiceById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(Service & { images: ServiceImage[]; category: Category }) | null>;

  findServices(
    where: Prisma.ServiceWhereInput,
    include: Prisma.ServiceInclude,
    skip: number,
    take: number,
    orderBy: Prisma.ServiceOrderByWithRelationInput,
    tx?: PrismaTransaction
  ): Promise<(Service & { images: ServiceImage[]; category: Category })[]>;

  countServices(
    where: Prisma.ServiceWhereInput,
    tx?: PrismaTransaction
  ): Promise<number>;

  updateService(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
      categoryId?: string;
      isActive?: boolean;
    },
    tx?: PrismaTransaction
  ): Promise<Service & { images: ServiceImage[] }>;

  deleteServiceImages(serviceId: string, tx?: PrismaTransaction): Promise<void>;

  createServiceImages(
    data: { url: string; serviceId: string }[],
    tx?: PrismaTransaction
  ): Promise<ServiceImage[]>;

  deleteService(id: string, tx?: PrismaTransaction): Promise<void>;

  findAppointmentsByServiceId(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(AppointmentService & { appointment: Appointment })[]>;

  findAppointmentsByServiceIds(
    ids: string[],
    tx?: PrismaTransaction
  ): Promise<(AppointmentService & { appointment: Appointment })[]>;
}

export class ServiceRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  async createService(
    data: {
      name: string;
      description: string;
      price: number;
      duration: number;
      categoryId: string;
      isActive: boolean;
    },
    tx?: PrismaTransaction
  ): Promise<Service> {
    const client = this.getClient(tx);
    return client.service.create({
      data,
    });
  }

  async findServiceById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<
    (Service & { images: ServiceImage[]; category: Category }) | null
  > {
    const client = this.getClient(tx);
    return client.service.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
      },
    });
  }

  async findServices(
    where: Prisma.ServiceWhereInput,
    include: Prisma.ServiceInclude,
    skip: number,
    take: number,
    orderBy: Prisma.ServiceOrderByWithRelationInput,
    tx?: PrismaTransaction
  ): Promise<(Service & { images: ServiceImage[]; category: Category })[]> {
    const client = this.getClient(tx);
    return client.service.findMany({
      where,
      include,
      skip,
      take,
      orderBy,
    });
  }

  async countServices(
    where: Prisma.ServiceWhereInput,
    tx?: PrismaTransaction
  ): Promise<number> {
    const client = this.getClient(tx);
    return client.service.count({
      where,
    });
  }

  async updateService(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
      categoryId?: string;
      isActive?: boolean;
    },
    tx?: PrismaTransaction
  ): Promise<Service & { images: ServiceImage[] }> {
    const client = this.getClient(tx);
    return client.service.update({
      where: { id },
      data,
      include: {
        images: true,
      },
    });
  }

  async deleteServiceImages(
    serviceId: string,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.serviceImage.deleteMany({
      where: { serviceId },
    });
  }

  async createServiceImages(
    data: { url: string; serviceId: string }[],
    tx?: PrismaTransaction
  ): Promise<ServiceImage[]> {
    const client = this.getClient(tx);
    return Promise.all(
      data.map((item) =>
        client.serviceImage.create({
          data: item,
        })
      )
    );
  }

  async deleteService(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = this.getClient(tx);
    await client.service.delete({
      where: { id },
    });
  }

  async findAppointmentsByServiceId(id: string, tx?: PrismaTransaction) {
    const client = this.getClient(tx);
    return client.appointmentService.findMany({
      where: { serviceId: id },
      include: {
        appointment: true,
      },
    });
  }

  async findAppointmentsByServiceIds(ids: string[], tx?: PrismaTransaction) {
    const client = this.getClient(tx);
    return client.appointmentService.findMany({
      where: { serviceId: { in: ids } },
      include: {
        appointment: true,
      },
    });
  }
}
