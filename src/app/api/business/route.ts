import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  const settings = await prisma.businessSettings.findFirst({
    select: {
      id: true,
      businessName: true,
      tagline: true,
      description: true,
      email: true,
      phone: true,
      address: true,
    },
  });
  return NextResponse.json(settings || {});
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const existing = await prisma.businessSettings.findFirst();

  if (!existing) {
    return NextResponse.json({ error: "Settings not initialized" }, { status: 404 });
  }

  const updated = await prisma.businessSettings.update({
    where: { id: existing.id },
    data: {
      ...(body.businessName !== undefined && { businessName: body.businessName }),
      ...(body.tagline !== undefined && { tagline: body.tagline }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
    },
    select: {
      id: true,
      businessName: true,
      tagline: true,
      description: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  return NextResponse.json(updated);
}
