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

    // First get all group memberships for this user
    const { data: memberships, error } = await supabase
      .from("suggested_group_members")
      .select(`
        group_id,
        group:suggested_groups(
          id,
          name,
          table_number,
          status,
          event_id
        )
      `)
      .eq("user_id", session.userId);

    if (error || !memberships || memberships.length === 0) {
      return NextResponse.json({ assignment: null });
    }

    // Find the group that matches the event and is approved with a table number
    let matchingGroup: {
      id: string;
      name: string;
      table_number: number | null;
      status: string;
      event_id: string;
    } | null = null;

    for (const membership of memberships) {
      const groupData = membership.group;
      if (!groupData) continue;

      // Handle both array and object formats from Supabase
      const group = Array.isArray(groupData) ? groupData[0] : groupData;

      if (group && group.event_id === eventId && group.status === "approved" && group.table_number) {
        matchingGroup = group;
        break;
      }
    }

    if (!matchingGroup) {
      return NextResponse.json({ assignment: null });
    }

    const group = matchingGroup;

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
