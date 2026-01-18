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

  // Handle PDF files
  if (fileExtension === "pdf" || mimeType === "application/pdf") {
    return await extractPdfSlides(file, eventId, supabase);
  }
  
  if (["ppt", "pptx", "ppsx"].includes(fileExtension || "")) {
    return {
      slides: [],
      error: "PowerPoint files are not directly supported. Please export your slides as a PDF or individual images (PNG or JPG) from PowerPoint (File > Export > PDF or File > Export > Change File Type > PNG).",
    };
  }

  return {
    slides: [],
    error: "Unsupported file format. Please upload PNG, JPG, PDF, or other image files.",
  };
}

async function extractPdfSlides(
  file: File,
  eventId: string,
  supabase: SupabaseClient
): Promise<SlideExtractionResult> {
  try {
    console.log("[extractPdfSlides] Starting PDF extraction for:", file.name);
    
    // Dynamic import of pdfjs-dist for server-side rendering
    const pdfjs = await import("pdfjs-dist");
    
    // Set up the worker source - using legacy build for Node.js compatibility
    pdfjs.GlobalWorkerOptions.workerSrc = "";
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    console.log("[extractPdfSlides] Loading PDF document...");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      // Disable worker for server-side
      isEvalSupported: false,
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    console.log("[extractPdfSlides] PDF has", numPages, "pages");
    
    const slides: Array<{ url: string; path: string; pageNumber: number }> = [];
    const errors: string[] = [];
    
    // Import canvas for server-side rendering
    const { createCanvas } = await import("canvas");
    
    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        console.log(`[extractPdfSlides] Processing page ${pageNum}/${numPages}`);
        
        const page = await pdf.getPage(pageNum);
        
        // Set scale for good quality (2x for crisp slides)
        const scale = 2;
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext("2d");
        
        // Render the page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to PNG buffer
        const pngBuffer = canvas.toBuffer("image/png");
        
        // Upload to Supabase storage
        const timestamp = Date.now();
        const filePath = `${eventId}/${timestamp}-page-${pageNum.toString().padStart(3, "0")}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from("slides")
          .upload(filePath, pngBuffer, {
            contentType: "image/png",
            upsert: false,
          });
        
        if (uploadError) {
          console.error(`[extractPdfSlides] Failed to upload page ${pageNum}:`, uploadError);
          errors.push(`Page ${pageNum}: ${uploadError.message}`);
          continue;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from("slides")
          .getPublicUrl(filePath);
        
        slides.push({
          url: urlData.publicUrl,
          path: filePath,
          pageNumber: pageNum,
        });
        
        console.log(`[extractPdfSlides] Successfully uploaded page ${pageNum}`);
        
        // Clean up page
        page.cleanup();
      } catch (pageError) {
        console.error(`[extractPdfSlides] Error processing page ${pageNum}:`, pageError);
        errors.push(`Page ${pageNum}: ${pageError instanceof Error ? pageError.message : "Unknown error"}`);
      }
    }
    
    // Clean up PDF
    await pdf.destroy();
    
    if (slides.length === 0 && errors.length > 0) {
      return {
        slides: [],
        error: `Failed to extract slides: ${errors.join("; ")}`,
      };
    }
    
    if (errors.length > 0) {
      console.warn("[extractPdfSlides] Some pages failed:", errors);
    }
    
    console.log(`[extractPdfSlides] Successfully extracted ${slides.length}/${numPages} slides`);
    
    return { slides };
  } catch (error) {
    console.error("[extractPdfSlides] Exception:", error);
    
    // Provide helpful error messages
    let errorMessage = "Failed to extract PDF slides";
    if (error instanceof Error) {
      if (error.message.includes("Invalid PDF")) {
        errorMessage = "The file appears to be corrupted or is not a valid PDF.";
      } else if (error.message.includes("password")) {
        errorMessage = "The PDF is password-protected. Please remove the password and try again.";
      } else {
        errorMessage = `PDF extraction failed: ${error.message}`;
      }
    }
    
    return {
      slides: [],
      error: errorMessage,
    };
  }
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

    const { error: uploadError } = await supabase.storage
      .from("slides")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadSingleImage] Upload error:", uploadError);
      console.error("[uploadSingleImage] Error details:", {
        message: uploadError.message,
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
