import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword, isAdminAuthenticated } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both fields required" }, { status: 400 });
  }

  const valid = await verifyAdminPassword(currentPassword);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const settings = await prisma.businessSettings.findFirst();
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.businessSettings.update({
    where: { id: settings.id },
    data: { adminPassword: hashed },
  });

  return NextResponse.json({ success: true });
}
