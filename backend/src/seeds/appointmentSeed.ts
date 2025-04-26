import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

async function seedAppointments() {
  try {
    console.log("Starting appointment seeding...");

    // Get users
    const user = await prisma.user.findUnique({
      where: { email: "user@example.com" },
    });

    const stylist = await prisma.user.findUnique({
      where: { email: "stylist@example.com" },
    });

    if (!user || !stylist) {
      throw new Error("Required users not found");
    }

    // Get all services
    const services = await prisma.service.findMany();
    if (services.length === 0) {
      throw new Error("No services found");
    }

    // Create 30 appointments
    for (let i = 0; i < 30; i++) {
      // Generate random date within next 30 days
      const date = DateTime.now()
        .plus({ days: Math.floor(Math.random() * 30) })
        .set({ hour: 9 + Math.floor(Math.random() * 8), minute: 0 })
        .toJSDate();

      // Randomly select 1-3 services
      const numServices = Math.floor(Math.random() * 3) + 1;
      const selectedServices = services
        .sort(() => Math.random() - 0.5)
        .slice(0, numServices);

      // Calculate total price and duration
      const totalPrice = selectedServices.reduce(
        (sum, service) => sum + Number(service.price),
        0
      );
      const estimatedDuration = selectedServices.reduce(
        (sum, service) => sum + service.duration,
        0
      );

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          userId: user.id,
          stylistId: stylist.id,
          date,
          status: "PENDING",
          notes: `Sample appointment ${i + 1}`,
          estimatedDuration,
          totalPrice,
          services: {
            create: selectedServices.map((service) => ({
              serviceId: service.id,
              numberOfPeople: 1,
            })),
          },
        },
      });

      console.log(`Appointment ${i + 1} created successfully`);
    }

    console.log("Appointment seeding completed successfully");
  } catch (error) {
    console.error("Error seeding appointments:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAppointments()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
