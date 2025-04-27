import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const users = [
  // Admin users
  {
    email: "admin@example.com",
    password: "password123",
    name: "Admin User",
    role: "admin",
  },
  {
    email: "admin1@example.com",
    password: "password123",
    name: "Admin User 1",
    role: "admin",
  },
  {
    email: "admin2@example.com",
    password: "password123",
    name: "Admin User 2",
    role: "admin",
  },
  {
    email: "admin3@example.com",
    password: "password123",
    name: "Admin User 3",
    role: "admin",
  },
  // Stylist users
  {
    email: "stylist@example.com",
    password: "password123",
    name: "Stylist User",
    role: "stylist",
  },
  {
    email: "stylist1@example.com",
    password: "password123",
    name: "Stylist User 1",
    role: "stylist",
  },
  {
    email: "stylist2@example.com",
    password: "password123",
    name: "Stylist User 2",
    role: "stylist",
  },
  {
    email: "stylist3@example.com",
    password: "password123",
    name: "Stylist User 3",
    role: "stylist",
  },
  // Regular users
  {
    email: "user@example.com",
    password: "password123",
    name: "Regular User",
    role: "user",
  },
  {
    email: "user1@example.com",
    password: "password123",
    name: "Regular User 1",
    role: "user",
  },
  {
    email: "user2@example.com",
    password: "password123",
    name: "Regular User 2",
    role: "user",
  },
  {
    email: "user3@example.com",
    password: "password123",
    name: "Regular User 3",
    role: "user",
    isDeactivated: true,
    deactivatedAt: new Date(),
  },
];

async function seedUsers() {
  try {
    console.log("Starting user seeding...");

    for (const userData of users) {
      const role = await prisma.role.findUnique({
        where: { name: userData.role },
      });

      if (!role) {
        console.error(`Role ${userData.role} not found`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          roleId: role.id,
          isDeactivated: userData.isDeactivated || false,
          deactivatedAt: userData.deactivatedAt || null,
        },
      });

      console.log(`User ${userData.email} created successfully`);
    }

    console.log("User seeding completed successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedUsers()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
