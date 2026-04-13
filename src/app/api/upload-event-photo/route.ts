import { NextRequest, NextResponse } from "next/server";
import { MOCK_EVENT } from "@/lib/mock/data";
import { addMockEventPhoto } from "@/lib/mock/state";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file || !eventId) {
      return NextResponse.json(
        { error: "Missing file or eventId" },
        { status: 400 }
      );
    }

    if (!isAllowedImage(file)) {
      return NextResponse.json(
        { error: "Only image files are supported (PNG, JPEG, WebP, GIF)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    if (USE_MOCK_DATA) {
      const photo = {
        id: `mock-upload-${Date.now()}`,
        event_id: eventId,
        uploaded_by: session.userId,
        file_url: "/cursor_china_photo/china-05.png",
        storage_path: `mock/${MOCK_EVENT.slug}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        caption: caption?.trim() || null,
        status: "pending" as const,
        reviewed_by: null,
        created_at: new Date().toISOString(),
        reviewed_at: null,
      };
      addMockEventPhoto(photo);
      return NextResponse.json({
        success: true,
        photo,
      });
    }

    const supabase = await createServiceClient();

    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${eventId}/${session.userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("event-photos")
      .upload(filePath, file, {
        contentType: file.type || "image/png",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("event-photos")
      .getPublicUrl(filePath);

    const { data: photo, error: insertError } = await supabase
      .from("event_photos")
      .insert({
        event_id: eventId,
        uploaded_by: session.userId,
        file_url: urlData.publicUrl,
        storage_path: filePath,
        caption: caption?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from("event-photos").remove([filePath]);
      return NextResponse.json(
        { error: `Failed to save photo record: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (err) {
    console.error("[upload-event-photo] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
