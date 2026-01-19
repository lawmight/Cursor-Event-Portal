import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;
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
  console.log("[upload-slide] Request received");
  
  try {
    const session = await getSession();
    if (!session) {
      console.log("[upload-slide] No session found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log("[upload-slide] Session found for user:", session.userId);

    const supabase = await createServiceClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.userId)
      .single();

    if (userError) {
      console.error("[upload-slide] Error fetching user:", userError);
    }
    
    if (!user || user.role !== "admin") {
      console.log("[upload-slide] User not admin:", user?.role);
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.log("[upload-slide] User is admin");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId") as string | null;

    console.log("[upload-slide] File:", file?.name, "Size:", file?.size, "Type:", file?.type);
    console.log("[upload-slide] EventId:", eventId);

    if (!file || !eventId) {
      console.log("[upload-slide] Missing file or eventId");
      return NextResponse.json({ error: "Missing file or eventId" }, { status: 400 });
    }

    if (!isAllowedImage(file)) {
      console.log("[upload-slide] Invalid file type:", file.type);
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      console.log("[upload-slide] File too large:", file.size);
      return NextResponse.json(
        { error: "File size exceeds 20MB limit" },
        { status: 400 }
      );
    }

    console.log("[upload-slide] Checking storage buckets...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("[upload-slide] Bucket list error:", bucketError);
      return NextResponse.json(
        { error: `Storage access error: ${bucketError.message}` },
        { status: 500 }
      );
    }
    
    console.log("[upload-slide] Available buckets:", buckets?.map(b => b.name).join(", ") || "none");

    const bucket = buckets?.find((item) => item.name === "slides");
    if (!bucket) {
      console.log("[upload-slide] Creating 'slides' bucket...");
      const { error: createError } = await supabase.storage.createBucket("slides", { public: true });
      if (createError) {
        console.error("[upload-slide] Failed to create bucket:", createError);
        return NextResponse.json(
          { error: `Storage bucket 'slides' not found and could not be created: ${createError.message}` },
          { status: 500 }
        );
      }
      console.log("[upload-slide] Bucket created successfully");
    } else if (!bucket.public) {
      console.log("[upload-slide] Making bucket public...");
      await supabase.storage.updateBucket("slides", { public: true });
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${eventId}/${Date.now()}-${safeFileName}`;
    
    console.log("[upload-slide] Uploading to path:", filePath);

    const { error: uploadError } = await supabase.storage
      .from("slides")
      .upload(filePath, file, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-slide] Upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload slide: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("slides")
      .getPublicUrl(filePath);

    console.log("[upload-slide] Upload successful, URL:", urlData.publicUrl);

    return NextResponse.json({
      success: true,
      slides: [
        {
          url: urlData.publicUrl,
          path: filePath,
        },
      ],
    });
  } catch (error) {
    console.error("[upload-slide] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
