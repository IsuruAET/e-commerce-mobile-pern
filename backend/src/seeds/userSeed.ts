import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const users = [
  {
    email: "admin@example.com",
    password: "password123",
    name: "Admin User",
    role: "admin",
  },
  {
    email: "stylist@example.com",
    password: "password123",
    name: "Stylist User",
    role: "stylist",
  },
  {
    email: "user@example.com",
    password: "password123",
    name: "Regular User",
    role: "user",
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
