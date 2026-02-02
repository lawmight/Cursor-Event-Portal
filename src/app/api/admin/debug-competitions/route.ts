import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const eventSlug = searchParams.get("eventSlug");

  try {
    const supabase = await createServiceClient();
    
    let targetEventId = eventId;
    
    // If eventSlug provided, look up the event
    if (eventSlug && !eventId) {
      const { data: event } = await supabase
        .from("events")
        .select("id, slug, name")
        .eq("slug", eventSlug)
        .single();
      
      if (!event) {
        return NextResponse.json({ error: "Event not found for slug: " + eventSlug }, { status: 404 });
      }
      targetEventId = event.id;
    }

    if (!targetEventId) {
      return NextResponse.json({ error: "eventId or eventSlug required" }, { status: 400 });
    }
    
    // Get all competitions for this event
    const { data: allComps, error: allError } = await supabase
      .from("competitions")
      .select("*")
      .eq("event_id", targetEventId);

    // Get only active/voting/ended competitions (what attendees see)
    const { data: activeComps, error: activeError } = await supabase
      .from("competitions")
      .select("*")
      .eq("event_id", targetEventId)
      .in("status", ["active", "voting", "ended"]);

    return NextResponse.json({ 
      success: true,
      eventId: targetEventId,
      all: {
        count: allComps?.length || 0,
        competitions: allComps?.map(c => ({ id: c.id, title: c.title, status: c.status })),
        error: allError?.message
      },
      activeOnly: {
        count: activeComps?.length || 0,
        competitions: activeComps?.map(c => ({ id: c.id, title: c.title, status: c.status })),
        error: activeError?.message
      }
    });
  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Unknown error" 
    }, { status: 500 });
  }
}
