import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing announcement ID" },
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

    // Verify announcement exists and belongs to an event the admin has access to
    const { data: announcement, error: fetchError } = await supabase
      .from("announcements")
      .select("id, event_id")
      .eq("id", id)
      .single();

    if (fetchError || !announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Delete the announcement
    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Announcement deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete announcement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Announcement DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

