import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  // Hair Styling Services
  {
    name: "Haircut",
    description: "Professional haircut service",
    price: 30.0,
    duration: 30,
  },
  {
    name: "Hair Coloring",
    description: "Professional hair coloring service",
    price: 80.0,
    duration: 120,
  },
  {
    name: "Hair Styling",
    description: "Professional hair styling service",
    price: 40.0,
    duration: 45,
  },
  {
    name: "Hair Treatment",
    description: "Deep conditioning hair treatment",
    price: 50.0,
    duration: 60,
  },
  {
    name: "Hair Extensions",
    description: "Professional hair extension service",
    price: 200.0,
    duration: 180,
  },

  // Facial Treatments
  {
    name: "Basic Facial",
    description: "Basic facial treatment",
    price: 60.0,
    duration: 60,
  },
  {
    name: "Deep Cleansing Facial",
    description: "Deep cleansing facial treatment",
    price: 80.0,
    duration: 90,
  },
  {
    name: "Anti-Aging Facial",
    description: "Anti-aging facial treatment",
    price: 100.0,
    duration: 90,
    isActive: false,
  },
  {
    name: "Acne Treatment",
    description: "Professional acne treatment",
    price: 70.0,
    duration: 60,
  },
  {
    name: "Skin Rejuvenation",
    description: "Skin rejuvenation treatment",
    price: 120.0,
    duration: 120,
  },

  // Nail Care
  {
    name: "Basic Manicure",
    description: "Basic manicure service",
    price: 25.0,
    duration: 30,
  },
  {
    name: "Basic Pedicure",
    description: "Basic pedicure service",
    price: 35.0,
    duration: 45,
  },
  {
    name: "Gel Nails",
    description: "Gel nail application",
    price: 45.0,
    duration: 60,
  },
  {
    name: "Nail Art",
    description: "Professional nail art service",
    price: 30.0,
    duration: 45,
  },
  {
    name: "Nail Repair",
    description: "Nail repair and maintenance",
    price: 20.0,
    duration: 30,
    isActive: false,
  },

  // Massage Therapy
  {
    name: "Swedish Massage",
    description: "Relaxing Swedish massage",
    price: 70.0,
    duration: 60,
  },
  {
    name: "Deep Tissue Massage",
    description: "Deep tissue massage therapy",
    price: 90.0,
    duration: 60,
  },
  {
    name: "Sports Massage",
    description: "Sports massage therapy",
    price: 80.0,
    duration: 60,
  },
  {
    name: "Hot Stone Massage",
    description: "Relaxing hot stone massage",
    price: 100.0,
    duration: 90,
    isActive: false,
  },
  {
    name: "Couples Massage",
    description: "Couples massage therapy",
    price: 150.0,
    duration: 90,
  },
];

async function seedServices() {
  try {
    console.log("Starting service seeding...");

    // Get all categories
    const categories = await prisma.category.findMany();

    if (categories.length === 0) {
      throw new Error(
        "No categories found in the database. Please seed categories first."
      );
    }

    for (const service of services) {
      // Get a random category ID
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];

      await prisma.service.upsert({
        where: { name: service.name },
        update: {
          categoryId: randomCategory.id,
        },
        create: {
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          categoryId: randomCategory.id,
          isActive: service.isActive ?? true,
        },
      });

      console.log(
        `Service ${service.name} created successfully with category ${randomCategory.name}`
      );
    }

    console.log("Service seeding completed successfully");
  } catch (error) {
    console.error("Error seeding services:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedServices()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
