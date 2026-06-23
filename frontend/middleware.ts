import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Allow NextAuth callbacks
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Protect all /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Admin-only area
    if (pathname.startsWith("/dashboard/admin") && token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/student", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*", "/api/student/:path*"],
};
