import type { SupabaseClient } from "@supabase/supabase-js";

interface SlideExtractionResult {
  slides: Array<{ url: string; path: string; pageNumber: number }>;
  error?: string;
}

export async function uploadSlideDeck(
  file: File,
  eventId: string,
  supabase: SupabaseClient
): Promise<SlideExtractionResult> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type;

  console.log("[uploadSlideDeck] Processing file:", file.name, "type:", mimeType, "ext:", fileExtension);

  // Handle direct image uploads
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(fileExtension || "")) {
    return await uploadSingleImage(file, eventId, supabase);
  }

  // For PDF and PowerPoint files, direct rendering requires native dependencies
  // Return a helpful error message
  if (fileExtension === "pdf") {
    return {
      slides: [],
      error: "PDF slide extraction is currently disabled. Please export your slides as individual images (PNG or JPG) and upload them one at a time.",
    };
  }
  
  if (["ppt", "pptx", "ppsx"].includes(fileExtension || "")) {
    return {
      slides: [],
      error: "PowerPoint files are not directly supported. Please export your slides as individual images (PNG or JPG) from PowerPoint (File > Export > Change File Type > PNG) and upload them one at a time.",
    };
  }

  return {
    slides: [],
    error: "Unsupported file format. Please upload PNG, JPG, or other image files.",
  };
}

async function uploadSingleImage(
  file: File,
  eventId: string,
  supabase: SupabaseClient
): Promise<SlideExtractionResult> {
  try {
    console.log("[uploadSingleImage] Uploading image:", file.name);
    
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${eventId}/${timestamp}-${safeFileName}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("slides")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadSingleImage] Upload error:", uploadError);
      console.error("[uploadSingleImage] Error details:", {
        message: uploadError.message,
        error: uploadError.error,
        name: uploadError.name,
      });
      
      // Provide more helpful error messages
      let errorMessage = `Failed to upload image: ${uploadError.message}`;
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("The resource was not found")) {
        errorMessage = "Storage bucket 'slides' not found. Please create it in Supabase dashboard with public access.";
      } else if (uploadError.message?.includes("new row violates row-level security")) {
        errorMessage = "Storage bucket permissions issue. Please check bucket policies in Supabase.";
      } else if (uploadError.message?.includes("JWT")) {
        errorMessage = "Authentication error. Please check SUPABASE_SERVICE_ROLE_KEY configuration.";
      }
      
      return {
        slides: [],
        error: errorMessage,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("slides")
      .getPublicUrl(filePath);

    console.log("[uploadSingleImage] Successfully uploaded to:", urlData.publicUrl);

    return {
      slides: [{
        url: urlData.publicUrl,
        path: filePath,
        pageNumber: 1,
      }],
    };
  } catch (error) {
    console.error("[uploadSingleImage] Exception:", error);
    return {
      slides: [],
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}

