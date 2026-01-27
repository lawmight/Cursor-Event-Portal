import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

function sanitizeFileName(fileName: string, maxBaseLength = 80) {
  const lastDotIndex = fileName.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < fileName.length - 1;
  const extension = hasExtension ? fileName.slice(lastDotIndex).toLowerCase() : ".pdf";
  const baseName = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;

  // Replace unsafe characters and collapse repeated underscores.
  const safeBase = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const truncatedBase =
    safeBase.length > maxBaseLength ? safeBase.slice(0, maxBaseLength) : safeBase;

  // Ensure we always return something usable.
  const finalBase = truncatedBase.length > 0 ? truncatedBase : "deck";
  return `${finalBase}${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();

    // Check for admin code in header (alternative to session auth)
    const adminCode = request.headers.get("x-admin-code");
    const headerEventId = request.headers.get("x-event-id");

    if (adminCode && headerEventId) {
      // Validate admin code against event
      const { data: event } = await supabase
        .from("events")
        .select("admin_code")
        .eq("id", headerEventId)
        .single();

      if (!event || event.admin_code !== adminCode) {
        return NextResponse.json({ error: "Invalid admin code" }, { status: 403 });
      }
      // Admin code is valid, proceed
    } else {
      // Fall back to session auth
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;

    if (!file || !eventId) {
      return NextResponse.json({ error: "Missing file or eventId" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ error: "Only PDF decks are supported" }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 100MB limit" }, { status: 400 });
    }

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      return NextResponse.json(
        { error: `Storage access error: ${bucketError.message}` },
        { status: 500 }
      );
    }

    const bucket = buckets?.find((item) => item.name === "slide-decks");
    if (!bucket) {
      const { error: createError } = await supabase.storage.createBucket("slide-decks", { public: true });
      if (createError) {
        return NextResponse.json(
          { error: "Storage bucket 'slide-decks' not found and could not be created." },
          { status: 500 }
        );
      }
    } else if (!bucket.public) {
      await supabase.storage.updateBucket("slide-decks", { public: true });
    }

    const { data: existingDeck } = await supabase
      .from("slide_decks")
      .select("storage_path")
      .eq("event_id", eventId)
      .single();

    if (existingDeck?.storage_path) {
      await supabase.storage.from("slide-decks").remove([existingDeck.storage_path]);
    }

    const safeFileName = sanitizeFileName(file.name);
    const filePath = `${eventId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("slide-decks")
      .upload(filePath, file, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload deck: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("slide-decks")
      .getPublicUrl(filePath);

    const { data: deck, error: deckError } = await supabase
      .from("slide_decks")
      .upsert(
        {
          event_id: eventId,
          pdf_url: urlData.publicUrl,
          storage_path: filePath,
          is_live: false, // Default to not live - admin must toggle it on
          popup_visible: false, // Default to not showing popup - admin must toggle it on
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id" }
      )
      .select()
      .single();

    if (deckError) {
      return NextResponse.json(
        { error: `Failed to save slide deck: ${deckError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deck });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
