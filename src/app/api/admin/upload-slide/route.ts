import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";
import { uploadSlideDeck } from "@/lib/utils/slide-extraction";

export async function POST(request: NextRequest) {
  try {
    // Check if admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Verify user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;

    if (!file || !eventId) {
      return NextResponse.json(
        { error: "Missing file or eventId" },
        { status: 400 }
      );
    }

    // Validate file type - accept slide deck formats
    const validTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow", // .ppsx
    ];
    
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const isValidType = validTypes.includes(file.type) || 
      ["pdf", "ppt", "pptx", "ppsx"].includes(fileExtension || "");

    if (!isValidType) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or PowerPoint file (.pdf, .ppt, .pptx, .ppsx)" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB for slide decks)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    console.log("[upload-slide] Starting slide deck processing, file size:", file.size, "type:", file.type);

    // Process the slide deck and extract slides
    const result = await uploadSlideDeck(file, eventId, supabase);

    console.log("[upload-slide] Extraction result:", {
      slideCount: result.slides?.length || 0,
      hasError: !!result.error,
      error: result.error,
    });

    if (result.error) {
      console.error("[upload-slide] Extraction error:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    if (!result.slides || result.slides.length === 0) {
      console.error("[upload-slide] No slides extracted");
      return NextResponse.json(
        { error: "No slides were extracted from the file" },
        { status: 500 }
      );
    }

    console.log("[upload-slide] Successfully extracted", result.slides.length, "slides");
    return NextResponse.json({
      success: true,
      slides: result.slides,
      count: result.slides.length,
    });
  } catch (error) {
    console.error("[upload-slide] Exception:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
