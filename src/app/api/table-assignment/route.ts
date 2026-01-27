import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const session = await getSession();
    if (!session || session.eventId !== eventId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("suggested_group_members")
      .select(`
        group:suggested_groups(
          id,
          name,
          table_number,
          status,
          event_id
        )
      `)
      .eq("user_id", session.userId)
      .eq("group.event_id", eventId)
      .single();

    if (error || !data?.group) {
      return NextResponse.json({ assignment: null });
    }

    const groupArray = data.group as {
      id: string;
      name: string;
      table_number: number | null;
      status: string;
      event_id: string;
    }[];
    const group = groupArray[0];

    if (!group || group.status !== "approved" || !group.table_number) {
      return NextResponse.json({ assignment: null });
    }

    return NextResponse.json({
      assignment: {
        tableNumber: group.table_number,
        groupName: group.name,
        groupId: group.id,
      },
    });
  } catch (error) {
    console.error("Table assignment lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
