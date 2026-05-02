import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots, timeToMinutes } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!date || !serviceId) {
    return NextResponse.json({ error: "date and serviceId are required" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  const workingHours = await prisma.workingHours.findFirst({
    where: { dayOfWeek, isActive: true },
  });

  if (!workingHours) {
    return NextResponse.json({ slots: [] });
  }

  const blockedTimes = await prisma.blockedTime.findMany({
    where: { date },
  });

  const wholeDayBlocked = blockedTimes.some((b) => !b.startTime && !b.endTime);
  if (wholeDayBlocked) {
    return NextResponse.json({ slots: [] });
  }

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { startTime: true, endTime: true },
  });

  const partialBlocks = blockedTimes
    .filter((b) => b.startTime && b.endTime)
    .map((b) => ({ startTime: b.startTime!, endTime: b.endTime! }));

  const allBlocked = [...existingAppointments, ...partialBlocks];

  let slots = generateTimeSlots(
    workingHours.startTime,
    workingHours.endTime,
    service.duration,
    allBlocked
  );

  // Filter out past slots for today
  const today = new Date().toISOString().split("T")[0];
  if (date === today) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30; // 30 min buffer
    slots = slots.filter((slot) => timeToMinutes(slot) >= nowMinutes);
  }

  return NextResponse.json({ slots });
}
