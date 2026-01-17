import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, email } = body;

    if (!eventId || !email) {
      return NextResponse.json(
        { error: "Missing eventId or email" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Look up user by email (exact match, case-insensitive)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .ilike("email", email.trim())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { found: false, error: "No registration found for this email" },
        { status: 404 }
      );
    }

    // Check if they have a registration for this event
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("id, checked_in_at")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { found: false, error: "No registration found for this event" },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (registration.checked_in_at) {
      return NextResponse.json({
        found: true,
        alreadyCheckedIn: true,
        attendee: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    }

    // Found and not checked in yet
    return NextResponse.json({
      found: true,
      alreadyCheckedIn: false,
      attendee: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
