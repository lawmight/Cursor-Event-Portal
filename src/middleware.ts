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

  // Protected routes for admin (except login page and API routes)
  // Redirect old admin routes (without adminCode) to login
  if (
    request.nextUrl.pathname.startsWith("/admin/") &&
    !request.nextUrl.pathname.startsWith("/admin/login") &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    // Check if this is an old admin route (without adminCode)
    // Pattern: /admin/[eventSlug] or /admin/[eventSlug]/something (but not /admin/[eventSlug]/[adminCode])
    const pathParts = request.nextUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === "admin") {
      // Check if second part looks like an eventSlug and third part doesn't look like an 8-digit adminCode
      if (pathParts.length === 2 || (pathParts.length >= 3 && !/^\d{8}$/.test(pathParts[2]))) {
        // This is an old route without adminCode - redirect to login
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
    }
    
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
