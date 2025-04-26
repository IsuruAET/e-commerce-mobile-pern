import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  // Hair Styling Services
  {
    name: "Haircut",
    description: "Professional haircut service",
    price: 30.0,
    duration: 30,
    category: "Hair Styling",
  },
  {
    name: "Hair Coloring",
    description: "Professional hair coloring service",
    price: 80.0,
    duration: 120,
    category: "Hair Styling",
  },
  {
    name: "Hair Styling",
    description: "Professional hair styling service",
    price: 40.0,
    duration: 45,
    category: "Hair Styling",
  },
  {
    name: "Hair Treatment",
    description: "Deep conditioning hair treatment",
    price: 50.0,
    duration: 60,
    category: "Hair Styling",
  },
  {
    name: "Hair Extensions",
    description: "Professional hair extension service",
    price: 200.0,
    duration: 180,
    category: "Hair Styling",
  },

  // Facial Treatments
  {
    name: "Basic Facial",
    description: "Basic facial treatment",
    price: 60.0,
    duration: 60,
    category: "Facial Treatments",
  },
  {
    name: "Deep Cleansing Facial",
    description: "Deep cleansing facial treatment",
    price: 80.0,
    duration: 90,
    category: "Facial Treatments",
  },
  {
    name: "Anti-Aging Facial",
    description: "Anti-aging facial treatment",
    price: 100.0,
    duration: 90,
    category: "Facial Treatments",
  },
  {
    name: "Acne Treatment",
    description: "Professional acne treatment",
    price: 70.0,
    duration: 60,
    category: "Facial Treatments",
  },
  {
    name: "Skin Rejuvenation",
    description: "Skin rejuvenation treatment",
    price: 120.0,
    duration: 120,
    category: "Facial Treatments",
  },

  // Nail Care
  {
    name: "Basic Manicure",
    description: "Basic manicure service",
    price: 25.0,
    duration: 30,
    category: "Nail Care",
  },
  {
    name: "Basic Pedicure",
    description: "Basic pedicure service",
    price: 35.0,
    duration: 45,
    category: "Nail Care",
  },
  {
    name: "Gel Nails",
    description: "Gel nail application",
    price: 45.0,
    duration: 60,
    category: "Nail Care",
  },
  {
    name: "Nail Art",
    description: "Professional nail art service",
    price: 30.0,
    duration: 45,
    category: "Nail Care",
  },
  {
    name: "Nail Repair",
    description: "Nail repair and maintenance",
    price: 20.0,
    duration: 30,
    category: "Nail Care",
  },

  // Massage Therapy
  {
    name: "Swedish Massage",
    description: "Relaxing Swedish massage",
    price: 70.0,
    duration: 60,
    category: "Massage Therapy",
  },
  {
    name: "Deep Tissue Massage",
    description: "Deep tissue massage therapy",
    price: 90.0,
    duration: 60,
    category: "Massage Therapy",
  },
  {
    name: "Sports Massage",
    description: "Sports massage therapy",
    price: 80.0,
    duration: 60,
    category: "Massage Therapy",
  },
  {
    name: "Hot Stone Massage",
    description: "Relaxing hot stone massage",
    price: 100.0,
    duration: 90,
    category: "Massage Therapy",
  },
  {
    name: "Couples Massage",
    description: "Couples massage therapy",
    price: 150.0,
    duration: 90,
    category: "Massage Therapy",
  },
];

async function seedServices() {
  try {
    console.log("Starting service seeding...");

    for (const service of services) {
      const category = await prisma.category.findUnique({
        where: { name: service.category },
      });

      if (!category) {
        console.error(`Category ${service.category} not found`);
        continue;
      }

      await prisma.service.upsert({
        where: { name: service.name },
        update: {},
        create: {
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          categoryId: category.id,
        },
      });

      console.log(`Service ${service.name} created successfully`);
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
