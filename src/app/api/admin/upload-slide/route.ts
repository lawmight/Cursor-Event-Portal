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

    // Process the slide deck and extract slides
    const result = await uploadSlideDeck(file, eventId, supabase);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slides: result.slides,
      count: result.slides.length,
    });
  } catch (error) {
    console.error("Upload slide deck error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
