import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, email, userId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId" },
        { status: 400 }
      );
    }

    // If neither email nor userId provided, check for session
    if (!email && !userId) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("portal_session");
      
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie.value);
          // Check if session is valid and matches this event
          if (session.userId && session.eventId === eventId && (!session.exp || session.exp > Date.now())) {
            // Use userId from session
            const supabase = await createServiceClient();
            const { data: user, error: userError } = await supabase
              .from("users")
              .select("id, name, email")
              .eq("id", session.userId)
              .single();

            if (!userError && user) {
              // Check if they have a registration for this event
              const { data: registration, error: regError } = await supabase
                .from("registrations")
                .select("id, checked_in_at")
                .eq("event_id", eventId)
                .eq("user_id", user.id)
                .single();

              if (!regError && registration) {
                return NextResponse.json({
                  found: true,
                  alreadyCheckedIn: !!registration.checked_in_at,
                  attendee: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                  },
                });
              }
            }
          }
        } catch {
          // Invalid session, continue with email lookup
        }
      }
    }

    // If email provided, use email lookup
    if (email) {
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
    }

    // If userId provided, use userId lookup
    if (userId) {
      const supabase = await createServiceClient();
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { found: false, error: "No user found" },
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
    }

    // If we get here, no email, userId, or valid session was provided
    return NextResponse.json(
      { found: false, error: "No registration found. Please enter your email or ensure you are logged in." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
