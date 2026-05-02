import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL || "file:/home/user/Booker/dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed business settings
  const existing = await prisma.businessSettings.findFirst();
  if (!existing) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.businessSettings.create({
      data: {
        businessName: "Serenity Wellness Spa",
        tagline: "Relax, restore, and rejuvenate",
        description:
          "Experience a sanctuary of calm with our professional wellness services. Each session is personalized to leave you feeling refreshed and renewed.",
        email: "hello@serenityspa.com",
        phone: "+1 (555) 123-4567",
        address: "123 Wellness Ave, Suite 200, San Francisco, CA 94102",
        adminPassword: hashedPassword,
      },
    });
    console.log("✓ Created business settings (password: admin123)");
  }

  // Seed services
  const servicesCount = await prisma.service.count();
  if (servicesCount === 0) {
    await prisma.service.createMany({
      data: [
        {
          name: "Swedish Massage",
          duration: 60,
          price: 85,
          description:
            "A classic full-body massage using long, flowing strokes to relax muscles and improve circulation.",
          isActive: true,
        },
        {
          name: "Deep Tissue Massage",
          duration: 60,
          price: 100,
          description:
            "Targets deeper layers of muscle tissue to relieve chronic pain and muscle tension.",
          isActive: true,
        },
        {
          name: "Facial Treatment",
          duration: 45,
          price: 75,
          description:
            "A customized facial cleansing, exfoliation, and moisturizing treatment for radiant skin.",
          isActive: true,
        },
        {
          name: "Hot Stone Therapy",
          duration: 90,
          price: 120,
          description:
            "Heated basalt stones are placed on key points of the body to melt away tension and stress.",
          isActive: true,
        },
        {
          name: "Aromatherapy Session",
          duration: 60,
          price: 90,
          description:
            "Essential oils combined with massage techniques to balance mind, body, and spirit.",
          isActive: true,
        },
      ],
    });
    console.log("✓ Created sample services");
  }

  // Seed working hours (Mon–Sat, 9am–6pm)
  const hoursCount = await prisma.workingHours.count();
  if (hoursCount === 0) {
    await prisma.workingHours.createMany({
      data: [
        { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isActive: false }, // Sun
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true },  // Mon
        { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isActive: true },  // Tue
        { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isActive: true },  // Wed
        { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isActive: true },  // Thu
        { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isActive: true },  // Fri
        { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", isActive: true },  // Sat
      ],
    });
    console.log("✓ Created default working hours");
  }

  console.log("✓ Database seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
