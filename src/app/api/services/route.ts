import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "true";

  const services = await prisma.service.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, duration, price, description } = body;

  if (!name || !duration || price === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      name,
      duration: Number(duration),
      price: Number(price),
      description: description || null,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
