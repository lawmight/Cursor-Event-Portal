import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function isAllowedImage(file: File) {
  if (ALLOWED_TYPES.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif")
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId") as string | null;
    const tableNumberRaw = formData.get("tableNumber") as string | null;
    const adminCode = formData.get("adminCode") as string | null;

    if (!file || !eventId || !tableNumberRaw) {
      return NextResponse.json({ error: "Missing file, eventId, or tableNumber" }, { status: 400 });
    }

    const tableNumber = Number.parseInt(tableNumberRaw, 10);
    if (!Number.isFinite(tableNumber) || tableNumber < 1) {
      return NextResponse.json({ error: "Invalid tableNumber" }, { status: 400 });
    }

    if (!isAllowedImage(file)) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Admin auth: allow adminCode OR admin session
    let isAuthorized = false;

    if (adminCode) {
      const { data: event } = await supabase
        .from("events")
        .select("admin_code")
        .eq("id", eventId)
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

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      return NextResponse.json(
        { error: `Storage access error: ${bucketError.message}` },
        { status: 500 }
      );
    }

    const bucket = buckets?.find((item) => item.name === "qr-codes");
    if (!bucket) {
      const { error: createError } = await supabase.storage.createBucket("qr-codes", { public: true });
      if (createError) {
        return NextResponse.json(
          { error: `Storage bucket 'qr-codes' not found and could not be created: ${createError.message}` },
          { status: 500 }
        );
      }
    } else if (!bucket.public) {
      await supabase.storage.updateBucket("qr-codes", { public: true });
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${eventId}/table-${tableNumber}-${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("qr-codes")
      .upload(filePath, file, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload QR code: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("qr-codes")
      .getPublicUrl(filePath);

    const { error: upsertError } = await supabase
      .from("table_qr_codes")
      .upsert({
        event_id: eventId,
        table_number: tableNumber,
        qr_image_url: urlData.publicUrl,
        storage_path: filePath,
      }, { onConflict: "event_id,table_number" });

    if (upsertError) {
      return NextResponse.json(
        { error: `Failed to save QR code record: ${upsertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qrCode: {
        eventId,
        tableNumber,
        url: urlData.publicUrl,
        path: filePath,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
