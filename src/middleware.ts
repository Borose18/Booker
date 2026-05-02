import { NextRequest, NextResponse } from "next/server";

const ADMIN_PATHS = ["/admin", "/admin/appointments", "/admin/services", "/admin/availability", "/admin/settings"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPath = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isLoginPath = pathname === "/admin/login";

  if (isAdminPath && !isLoginPath) {
    const session = req.cookies.get("booker_admin_session");
    if (!session || session.value !== "authenticated") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
