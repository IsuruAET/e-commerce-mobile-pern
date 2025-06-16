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

// Base types
export type ServiceWithRelations = Service & {
  images: ServiceImage[];
  category: Category;
};

export type ServiceCreateData = {
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId: string;
  isActive: boolean;
};

// Core CRUD operations
export interface IServiceCRUD {
  createService(
    data: ServiceCreateData,
    tx?: PrismaTransaction
  ): Promise<Service>;

  findServiceById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<ServiceWithRelations | null>;

  updateService(
    id: string,
    data: Partial<ServiceCreateData>,
    tx?: PrismaTransaction
  ): Promise<Service & { images: ServiceImage[] }>;

  deleteService(id: string, tx?: PrismaTransaction): Promise<void>;
}

// Query operations
export interface IServiceQuery {
  findServices(
    where: Prisma.ServiceWhereInput,
    include: Prisma.ServiceInclude,
    skip: number,
    take: number,
    orderBy: Prisma.ServiceOrderByWithRelationInput,
    tx?: PrismaTransaction
  ): Promise<ServiceWithRelations[]>;

  countServices(
    where: Prisma.ServiceWhereInput,
    tx?: PrismaTransaction
  ): Promise<number>;

  findServicesByCategoryId(
    categoryId: string,
    tx?: PrismaTransaction
  ): Promise<Service[]>;
}

// Image operations
export interface IServiceImageOperations {
  deleteServiceImages(serviceId: string, tx?: PrismaTransaction): Promise<void>;

  createServiceImages(
    data: { url: string; serviceId: string }[],
    tx?: PrismaTransaction
  ): Promise<ServiceImage[]>;
}

// Appointment operations
export interface IServiceAppointmentOperations {
  findAppointmentsByServiceId(
    id: string,
    tx?: PrismaTransaction
  ): Promise<(AppointmentService & { appointment: Appointment })[]>;

  findAppointmentsByServiceIds(
    ids: string[],
    tx?: PrismaTransaction
  ): Promise<(AppointmentService & { appointment: Appointment })[]>;
}

// Management operations
export interface IServiceManagement {
  updateCategoryServices(
    categoryId: string,
    isActive: boolean,
    tx?: PrismaTransaction
  ): Promise<void>;
}

// Combined interface
export interface IServiceRepository
  extends IServiceCRUD,
    IServiceQuery,
    IServiceImageOperations,
    IServiceAppointmentOperations,
    IServiceManagement {}

// Base repository
export abstract class BaseServiceRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected getClient(tx?: PrismaTransaction): PrismaTransaction {
    return tx || this.prisma;
  }

  protected getDefaultInclude() {
    return {
      images: true,
      category: true,
    };
  }
}

// CRUD operations repository
export class ServiceCRUDRepository
  extends BaseServiceRepository
  implements IServiceCRUD
{
  async createService(
    data: ServiceCreateData,
    tx?: PrismaTransaction
  ): Promise<Service> {
    const client = this.getClient(tx);
    return client.service.create({ data });
  }

  async findServiceById(
    id: string,
    tx?: PrismaTransaction
  ): Promise<ServiceWithRelations | null> {
    const client = this.getClient(tx);
    return client.service.findUnique({
      where: { id },
      include: this.getDefaultInclude(),
    });
  }

  async updateService(
    id: string,
    data: Partial<ServiceCreateData>,
    tx?: PrismaTransaction
  ): Promise<Service & { images: ServiceImage[] }> {
    const client = this.getClient(tx);
    return client.service.update({
      where: { id },
      data,
      include: { images: true },
    });
  }

  async deleteService(id: string, tx?: PrismaTransaction): Promise<void> {
    const client = this.getClient(tx);
    await client.service.delete({ where: { id } });
  }
}

// Query operations repository
export class ServiceQueryRepository
  extends BaseServiceRepository
  implements IServiceQuery
{
  async findServices(
    where: Prisma.ServiceWhereInput,
    include: Prisma.ServiceInclude,
    skip: number,
    take: number,
    orderBy: Prisma.ServiceOrderByWithRelationInput,
    tx?: PrismaTransaction
  ): Promise<ServiceWithRelations[]> {
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
    return client.service.count({ where });
  }

  async findServicesByCategoryId(
    categoryId: string,
    tx?: PrismaTransaction
  ): Promise<Service[]> {
    const client = this.getClient(tx);
    return client.service.findMany({
      where: {
        categoryId,
        isActive: true,
      },
    });
  }
}

// Image operations repository
export class ServiceImageRepository
  extends BaseServiceRepository
  implements IServiceImageOperations
{
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
}

// Appointment operations repository
export class ServiceAppointmentRepository
  extends BaseServiceRepository
  implements IServiceAppointmentOperations
{
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

// Management repository
export class ServiceManagementRepository
  extends BaseServiceRepository
  implements IServiceManagement
{
  async updateCategoryServices(
    categoryId: string,
    isActive: boolean,
    tx?: PrismaTransaction
  ): Promise<void> {
    const client = this.getClient(tx);
    await client.service.updateMany({
      where: {
        categoryId,
        isActive: !isActive,
      },
      data: {
        isActive,
      },
    });
  }
}

// Main repository that combines all functionality
export class ServiceRepository implements IServiceRepository {
  private crud: ServiceCRUDRepository;
  private query: ServiceQueryRepository;
  private image: ServiceImageRepository;
  private appointment: ServiceAppointmentRepository;
  private management: ServiceManagementRepository;

  constructor(prisma: PrismaClient) {
    this.crud = new ServiceCRUDRepository(prisma);
    this.query = new ServiceQueryRepository(prisma);
    this.image = new ServiceImageRepository(prisma);
    this.appointment = new ServiceAppointmentRepository(prisma);
    this.management = new ServiceManagementRepository(prisma);
  }

  // Delegate all methods to appropriate repositories
  createService = (data: ServiceCreateData, tx?: PrismaTransaction) =>
    this.crud.createService(data, tx);

  findServiceById = (id: string, tx?: PrismaTransaction) =>
    this.crud.findServiceById(id, tx);

  updateService = (
    id: string,
    data: Partial<ServiceCreateData>,
    tx?: PrismaTransaction
  ) => this.crud.updateService(id, data, tx);

  deleteService = (id: string, tx?: PrismaTransaction) =>
    this.crud.deleteService(id, tx);

  findServices = (
    where: Prisma.ServiceWhereInput,
    include: Prisma.ServiceInclude,
    skip: number,
    take: number,
    orderBy: Prisma.ServiceOrderByWithRelationInput,
    tx?: PrismaTransaction
  ) => this.query.findServices(where, include, skip, take, orderBy, tx);

  countServices = (where: Prisma.ServiceWhereInput, tx?: PrismaTransaction) =>
    this.query.countServices(where, tx);

  findServicesByCategoryId = (categoryId: string, tx?: PrismaTransaction) =>
    this.query.findServicesByCategoryId(categoryId, tx);

  deleteServiceImages = (serviceId: string, tx?: PrismaTransaction) =>
    this.image.deleteServiceImages(serviceId, tx);

  createServiceImages = (
    data: { url: string; serviceId: string }[],
    tx?: PrismaTransaction
  ) => this.image.createServiceImages(data, tx);

  findAppointmentsByServiceId = (id: string, tx?: PrismaTransaction) =>
    this.appointment.findAppointmentsByServiceId(id, tx);

  findAppointmentsByServiceIds = (ids: string[], tx?: PrismaTransaction) =>
    this.appointment.findAppointmentsByServiceIds(ids, tx);

  updateCategoryServices = (
    categoryId: string,
    isActive: boolean,
    tx?: PrismaTransaction
  ) => this.management.updateCategoryServices(categoryId, isActive, tx);
}
