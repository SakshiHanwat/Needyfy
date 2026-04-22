import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const role = request.cookies.get("needyfy_role")?.value;
  const { pathname } = request.nextUrl;

  // NGO routes ko volunteer access na kar sake
  if (pathname.startsWith("/dashboard") && role === "volunteer") {
    return NextResponse.redirect(new URL("/volunteers", request.url));
  }

  // Volunteer routes ko NGO access na kar sake
  if (pathname.startsWith("/volunteers") && role === "ngo") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/volunteers/:path*"],
};