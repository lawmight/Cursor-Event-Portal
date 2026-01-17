import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, content } = body;

    if (!eventId || !content) {
      return NextResponse.json(
        { error: "Missing eventId or content" },
        { status: 400 }
      );
    }

    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify admin role
    const supabase = await createServiceClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.userId)
      .single();

    if (userError) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    if (!user || user.role !== "admin") {
      console.error("Admin check failed:", { userId: session.userId, userFound: !!user, role: user?.role });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Verify event exists
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Create announcement with published_at set to now
    const { data: announcement, error: insertError } = await supabase
      .from("announcements")
      .insert({
        event_id: eventId,
        content: content.trim(),
        priority: 0,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Announcement creation error:", insertError);
      return NextResponse.json(
        { error: "Failed to create announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Announcement POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
