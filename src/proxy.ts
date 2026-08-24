import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { isStaff } from "@/lib/auth/rbac";

// Must match session.COOKIE_NAME. Hardcoded here because proxy runs on the
// edge runtime and cannot import the server-only session module.
const COOKIE_NAME = "pikol_session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const claims = token ? await verifyToken(token) : null;
  const isAuthed = Boolean(claims);

  const isStaffArea = pathname.startsWith("/admin");
  const isMemberArea = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Gate protected areas
  if ((isStaffArea || isMemberArea) && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Admin area requires admin/owner
  if (isStaffArea && !isStaff(claims?.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Authed users shouldn't see login/register
  if (isAuthed && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = isStaff(claims?.role) ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/profile/:path*", "/login", "/register"],
};
