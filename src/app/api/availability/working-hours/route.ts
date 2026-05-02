import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
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
  const created = await prisma.workingHours.createMany({
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
