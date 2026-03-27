import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function redirectWithCookies(response: NextResponse, url: URL) {
  const redirectResponse = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  // Update Supabase auth session
  const response = await updateSession(request);

  // Protected routes for staff
  if (request.nextUrl.pathname.includes("/staff/")) {
    // Check for session cookie (simplified for MVP)
    const sessionCookie = request.cookies.get("portal_session");
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return redirectWithCookies(response, url);
    }
  }

  // Admin routes protection (except login page)
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
      return response;
    }

    // Create Supabase client to check auth
    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return redirectWithCookies(response, url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
