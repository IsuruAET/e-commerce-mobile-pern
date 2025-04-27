import { PrismaClient, AppointmentStatus } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

async function seedAppointments() {
  try {
    console.log("Starting appointment seeding...");

    // Get all users and stylists
    const users = await prisma.user.findMany({
      where: {
        role: {
          name: "user",
        },
      },
    });

    const stylists = await prisma.user.findMany({
      where: {
        role: {
          name: "stylist",
        },
      },
    });

    if (users.length === 0 || stylists.length === 0) {
      throw new Error("No users or stylists found");
    }

    // Get all services
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
      },
    });
    if (services.length === 0) {
      throw new Error("No services found");
    }

    // Get all possible appointment statuses
    const statuses = Object.values(AppointmentStatus);

    // Create 40 appointments
    for (let i = 0; i < 40; i++) {
      // Randomly select a user and stylist
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomStylist =
        stylists[Math.floor(Math.random() * stylists.length)];

      // Generate random date within next 30 days
      const appointmentDateTime = DateTime.now()
        .plus({ days: Math.floor(Math.random() * 30) })
        .set({ hour: 9 + Math.floor(Math.random() * 8), minute: 0 })
        .toJSDate();

      // Randomly select 1-3 services
      const numServices = Math.floor(Math.random() * 3) + 1;
      const shuffledServices = [...services].sort(() => Math.random() - 0.5);
      const selectedServices = shuffledServices.slice(0, numServices);

      // Calculate total price and duration
      const totalPrice = selectedServices.reduce(
        (sum, service) => sum + Number(service.price),
        0
      );
      const estimatedDuration = selectedServices.reduce(
        (sum, service) => sum + service.duration,
        0
      );

      // Randomly select a status
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

      // Create appointment
      await prisma.appointment.create({
        data: {
          userId: randomUser.id,
          stylistId: randomStylist.id,
          dateTime: appointmentDateTime,
          status: randomStatus,
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
