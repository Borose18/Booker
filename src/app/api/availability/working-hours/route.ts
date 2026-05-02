import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated, ensureDefaultSettings } from "@/lib/auth";

async function ensureDefaultHours() {
  const count = await prisma.workingHours.count();
  if (count === 0) {
    await prisma.workingHours.createMany({
      data: [
        { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isActive: false },
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true },
        { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isActive: true },
        { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isActive: true },
        { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isActive: true },
        { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isActive: true },
        { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", isActive: true },
      ],
    });
  }
}

export async function GET() {
  await ensureDefaultSettings();
  await ensureDefaultHours();
  const hours = await prisma.workingHours.findMany({
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(hours);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { hours } = body;

  if (!Array.isArray(hours)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.workingHours.deleteMany();
  await prisma.workingHours.createMany({
    data: hours.map((h: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }) => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
      isActive: h.isActive,
    })),
  });

  const result = await prisma.workingHours.findMany({ orderBy: { dayOfWeek: "asc" } });
  return NextResponse.json(result);
}
