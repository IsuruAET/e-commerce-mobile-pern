import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Hair Styling",
    description: "Professional hair styling and cutting services",
    image: "https://example.com/hair-styling.jpg",
  },
  {
    name: "Facial Treatments",
    description: "Rejuvenating facial treatments and skincare services",
    image: "https://example.com/facial-treatments.jpg",
  },
  {
    name: "Nail Care",
    description: "Manicure, pedicure, and nail art services",
    image: "https://example.com/nail-care.jpg",
  },
  {
    name: "Massage Therapy",
    description: "Relaxing and therapeutic massage services",
    image: "https://example.com/massage-therapy.jpg",
  },
];

async function seedCategories() {
  try {
    console.log("Starting category seeding...");

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });

      console.log(`Category ${category.name} created successfully`);
    }

    console.log("Category seeding completed successfully");
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedCategories()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
