import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  try {
    const supabase = await createServiceClient();
    
    // Get all competitions for this event
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("event_id", eventId);

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      competitions: data 
    });
  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Unknown error" 
    }, { status: 500 });
  }
}
