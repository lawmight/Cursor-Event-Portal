import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Update Supabase auth session
  const response = await updateSession(request);

  // Protected routes for staff
  if (request.nextUrl.pathname.includes("/staff/")) {
    // Check for session cookie (simplified for MVP)
    const sessionCookie = request.cookies.get("portal_session");
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Protected routes for admin (except login page)
  if (request.nextUrl.pathname.includes("/admin/") && !request.nextUrl.pathname.includes("/admin/login")) {
    const sessionCookie = request.cookies.get("portal_session");
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
