import { NextRequest, NextResponse } from "next/server";
import { getEventBySlug, getDisplayPageData } from "@/lib/supabase/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const data = await getDisplayPageData(event.id);
  if (!data) {
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }

  return NextResponse.json(data);
}
