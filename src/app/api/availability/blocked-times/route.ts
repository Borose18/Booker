import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const blocked = await prisma.blockedTime.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(blocked);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { date, startTime, endTime, reason } = body;

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const blocked = await prisma.blockedTime.create({
    data: {
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
    },
  });

  return NextResponse.json(blocked, { status: 201 });
}
