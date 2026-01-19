import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Health check for debugging
export async function GET() {
  return NextResponse.json({ status: "ok", route: "admin/login" });
}

// Admin login API route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, role")
      .ilike("email", email.trim())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized. Admin access required." },
        { status: 403 }
      );
    }

    // Find an event they're registered for (or any active event)
    const { data: registration } = await supabase
      .from("registrations")
      .select("event_id, events(slug, admin_code)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    let eventId: string;
    let eventSlug: string;
    let adminCode: string;

    if (registration && registration.events) {
      eventId = registration.event_id;
      // Handle both array and single object responses from Supabase
      const eventData = Array.isArray(registration.events)
        ? registration.events[0]
        : registration.events;
      eventSlug = (eventData as { slug: string; admin_code: string }).slug;
      adminCode = (eventData as { slug: string; admin_code: string }).admin_code;
    } else {
      // Find any published event
      const { data: anyEvent } = await supabase
        .from("events")
        .select("id, slug, admin_code")
        .eq("status", "published")
        .limit(1)
        .single();

      if (!anyEvent) {
        return NextResponse.json(
          { error: "No active events found" },
          { status: 404 }
        );
      }

      eventId = anyEvent.id;
      eventSlug = anyEvent.slug;
      adminCode = anyEvent.admin_code;

      // Create registration for admin (ignore if already exists)
      await supabase.from("registrations").upsert({
        event_id: eventId,
        user_id: user.id,
        source: "link",
        checked_in_at: new Date().toISOString(),
      }, { onConflict: "event_id,user_id", ignoreDuplicates: true });
    }

    // Set session cookie
    const session = {
      eventId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    };

    const cookieStore = await cookies();
    cookieStore.set("portal_session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({
      success: true,
      eventSlug,
      adminCode,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
