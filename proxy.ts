import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const role = request.cookies.get("needyfy_role")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && role === "volunteer") {
    return NextResponse.redirect(new URL("/volunteers", request.url));
  }

  if (pathname.startsWith("/volunteers") && role === "ngo") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/volunteers/:path*"],
};