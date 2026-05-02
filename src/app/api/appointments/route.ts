import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { sendBookingConfirmation } from "@/lib/email";
import { timeToMinutes, minutesToTime } from "@/lib/utils";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(date && { date }),
      ...(status && { status }),
    },
    include: { service: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { serviceId, customerName, customerEmail, customerPhone, date, startTime, notes } = body;

  if (!serviceId || !customerName || !customerEmail || !date || !startTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const endMinutes = timeToMinutes(startTime) + service.duration;
  const endTime = minutesToTime(endMinutes);

  // Check for conflicts
  const existing = await prisma.appointment.findMany({
    where: {
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  const conflict = existing.some((apt) => {
    const existStart = timeToMinutes(apt.startTime);
    const existEnd = timeToMinutes(apt.endTime);
    const newStart = timeToMinutes(startTime);
    const newEnd = endMinutes;
    return newStart < existEnd && newEnd > existStart;
  });

  if (conflict) {
    return NextResponse.json({ error: "Time slot is no longer available" }, { status: 409 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      serviceId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      date,
      startTime,
      endTime,
      status: "CONFIRMED",
      notes: notes || null,
    },
    include: { service: true },
  });

  const settings = await prisma.businessSettings.findFirst();

  sendBookingConfirmation({
    customerName,
    customerEmail,
    serviceName: service.name,
    date,
    startTime,
    endTime,
    price: service.price,
    businessName: settings?.businessName || "Our Business",
    businessEmail: settings?.email,
    businessPhone: settings?.phone,
  }).catch(console.error);

  return NextResponse.json(appointment, { status: 201 });
}
