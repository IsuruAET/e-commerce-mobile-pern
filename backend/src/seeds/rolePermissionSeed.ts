import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rolesAndPermissions = {
  admin: [
    // Appointment permissions
    "create_appointment",
    "read_appointment",
    "update_appointment",
    "read_appointments",
    "read_user_appointments",
    "read_stylist_appointments",
    "read_appointment_stats",
    // Auth permissions
    "manage_auth",
    // Category permissions
    "create_category",
    "read_category",
    "read_categories",
    "update_category",
    "delete_category",
    // Role permissions
    "manage_roles",
    // Service permissions
    "create_service",
    "read_active_services",
    "read_service",
    "read_services",
    "update_service",
    "delete_service",
    // User permissions
    "create_user",
    "read_user",
    "read_users",
    "update_user",
    "delete_user",
    "manage_users",
  ],
  stylist: [
    // Appointment permissions
    "create_appointment",
    "read_appointment",
    "update_appointment",
    "read_stylist_appointments",
    // Auth permissions
    "manage_auth",
    // Category permissions
    "read_category",
    "read_categories",
    // Service permissions
    "read_active_services",
    "read_service",
  ],
  user: [
    // Appointment permissions
    "create_appointment",
    "read_appointment",
    "update_appointment",
    "read_user_appointments",
    // Auth permissions
    "manage_auth",
    // Category permissions
    "read_category",
    "read_categories",
    // Service permissions
    "read_active_services",
    "read_service",
  ],
};

async function seedRolesAndPermissions() {
  try {
    console.log("Starting roles and permissions seeding...");

    // Create all permissions first
    const allPermissions = new Set(Object.values(rolesAndPermissions).flat());

    for (const permission of allPermissions) {
      await prisma.permission.upsert({
        where: { name: permission },
        update: {},
        create: { name: permission },
      });
    }

    console.log("Permissions created successfully");

    // Create roles with their permissions
    for (const [roleName, permissions] of Object.entries(rolesAndPermissions)) {
      const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });

      // Get all permission IDs for this role
      const permissionRecords = await prisma.permission.findMany({
        where: { name: { in: permissions } },
      });

      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Create new role permissions
      await prisma.rolePermission.createMany({
        data: permissionRecords.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
      });

      console.log(`Role ${roleName} created with permissions`);
    }

    console.log("Roles and permissions seeding completed successfully");
  } catch (error) {
    console.error("Error seeding roles and permissions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedRolesAndPermissions()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
