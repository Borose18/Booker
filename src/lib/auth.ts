import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "booker_admin_session";
const SESSION_VALUE = "authenticated";
const DEFAULT_PASSWORD = "admin123";

export async function ensureDefaultSettings() {
  const existing = await prisma.businessSettings.findFirst();
  if (!existing) {
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    await prisma.businessSettings.create({
      data: {
        businessName: "My Business",
        adminPassword: hashed,
      },
    });
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  await ensureDefaultSettings();
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) return false;
  return bcrypt.compare(password, settings.adminPassword);
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
