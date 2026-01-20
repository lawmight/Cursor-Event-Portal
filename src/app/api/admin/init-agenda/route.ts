import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

const EVENT_SLUG = "calgary-jan-2026";

// Agenda items for Calgary Cursor Meetup - January 2026
// Event: 5:00pm opening, 5:30pm start, 8:30pm finish MST on Jan 28, 2026 = 12:00am-3:30am UTC on Jan 29, 2026
const AGENDA_ITEMS = [
  {
    title: "Mingling & Networking",
    description: "Arrive early and connect with fellow developers. The room is set up with collaboration pods for small group discussions.",
    start_time: "2026-01-29T00:00:00Z", // 5:00pm MST (opening)
    end_time: "2026-01-29T00:30:00Z", // 5:30pm MST (start)
    sort_order: 0,
  },
  {
    title: "Welcome & Introductions",
    description: "Brief introduction to the event, agenda overview, and what to expect throughout the evening.",
    speaker: "Jia Ming Huang",
    start_time: "2026-01-29T00:30:00Z", // 5:30pm MST
    end_time: "2026-01-29T00:35:00Z", // 5:35pm MST
    sort_order: 1,
  },
  {
    title: "Short Demos",
    description: "Quick demonstrations showcasing what's possible with Cursor. Each demo runs up to 5 minutes.",
    speaker: "Simon Loewen",
    start_time: "2026-01-29T00:35:00Z", // 5:35pm MST
    end_time: "2026-01-29T00:50:00Z", // 5:50pm MST
    sort_order: 2,
  },
  {
    title: "Build Session",
    description: "Collaborative building session where you work with your pod to create something together. Facilitators will be available to help and answer questions.",
    start_time: "2026-01-29T00:50:00Z", // 5:50pm MST
    end_time: "2026-01-29T02:20:00Z", // 7:20pm MST
    sort_order: 3,
  },
  {
    title: "Blitz Demos & Community Voting",
    description: "Each pod presents a quick demo of what they built. The community votes on their favorites, with prizes awarded to the winners.",
    start_time: "2026-01-29T02:20:00Z", // 7:20pm MST
    end_time: "2026-01-29T03:00:00Z", // 8:00pm MST
    sort_order: 4,
  },
  {
    title: "Networking & Tear-Down",
    description: "Continue networking with other attendees, exchange contact information, and connect with the community.",
    start_time: "2026-01-29T03:00:00Z", // 8:00pm MST
    end_time: "2026-01-29T03:30:00Z", // 8:30pm MST (finish)
    sort_order: 5,
  },
];

export async function POST(request: NextRequest) {
  try {
    // Check if admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Verify user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("slug", EVENT_SLUG)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if agenda items already exist
    const { data: existingItems } = await supabase
      .from("agenda_items")
      .select("id")
      .eq("event_id", event.id);

    if (existingItems && existingItems.length > 0) {
      return NextResponse.json({
        message: "Agenda items already exist",
        count: existingItems.length,
      });
    }

    // Insert agenda items
    const itemsToInsert = AGENDA_ITEMS.map((item) => ({
      event_id: event.id,
      ...item,
    }));

    const { data, error } = await supabase
      .from("agenda_items")
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error("Error inserting agenda items:", error);
      return NextResponse.json(
        { error: "Failed to create agenda items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${data.length} agenda items`,
      items: data,
    });
  } catch (error) {
    console.error("Init agenda error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

