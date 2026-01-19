import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
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

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
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
