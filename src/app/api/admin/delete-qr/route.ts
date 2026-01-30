import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();

    const body = await request.json();
    const qrCodeId = body?.qrCodeId as string | null;
    const adminCode = body?.adminCode as string | null;

    if (!qrCodeId) {
      return NextResponse.json({ error: "Missing qrCodeId" }, { status: 400 });
    }

    const { data: qrCode, error: fetchError } = await supabase
      .from("table_qr_codes")
      .select("id, event_id, storage_path")
      .eq("id", qrCodeId)
      .single();

    if (fetchError || !qrCode) {
      return NextResponse.json(
        { error: "QR code record not found" },
        { status: 404 }
      );
    }

    // Admin auth: adminCode for this event OR admin session
    let isAuthorized = false;

    if (adminCode) {
      const { data: event } = await supabase
        .from("events")
        .select("admin_code")
        .eq("id", qrCode.event_id)
        .single();

      if (event && event.admin_code === adminCode) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.userId)
        .single();

      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    // Remove file from storage if we have a path
    if (qrCode.storage_path) {
      await supabase.storage.from("qr-codes").remove([qrCode.storage_path]);
    }

    const { error: deleteError } = await supabase
      .from("table_qr_codes")
      .delete()
      .eq("id", qrCodeId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete QR code: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
