import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { sendCancellationEmail } from "@/lib/email";
import { timeToMinutes, minutesToTime } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: { service: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let endTime = existing.endTime;
  if (body.startTime && body.date) {
    const endMinutes = timeToMinutes(body.startTime) + existing.service.duration;
    endTime = minutesToTime(endMinutes);
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.startTime !== undefined && { startTime: body.startTime, endTime }),
      ...(body.date !== undefined && { date: body.date }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { service: true },
  });

  if (body.status === "CANCELLED") {
    const settings = await prisma.businessSettings.findFirst();
    sendCancellationEmail({
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      serviceName: appointment.service.name,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      price: appointment.service.price,
      businessName: settings?.businessName || "Our Business",
      businessEmail: settings?.email,
      businessPhone: settings?.phone,
    }).catch(console.error);
  }

  return NextResponse.json(appointment);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
