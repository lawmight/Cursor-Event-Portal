import type { SupabaseClient } from "@supabase/supabase-js";

// Dynamic imports to handle serverless environments
let pdfjsLib: any;
let createCanvas: any;

async function loadPdfJs() {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // Configure pdfjs to work in Node.js
      if (typeof window === "undefined" && pdfjsLib.GlobalWorkerOptions) {
        // @ts-ignore
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }
    } catch (e) {
      console.error("Failed to load pdfjs-dist:", e);
      throw new Error("PDF processing library not available");
    }
  }
  return pdfjsLib;
}

async function loadCanvas() {
  if (!createCanvas) {
    try {
      const canvasModule = await import("canvas");
      createCanvas = canvasModule.createCanvas;
    } catch (e) {
      console.warn("Canvas module not available:", e);
      return null;
    }
  }
  return createCanvas;
}

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

  if (fileExtension === "pdf") {
    return await extractSlidesFromPDF(file, eventId, supabase);
  } else if (["ppt", "pptx", "ppsx"].includes(fileExtension || "")) {
    // For PowerPoint files, we'll need a different approach
    // For now, return an error suggesting conversion to PDF
    return {
      slides: [],
      error: "PowerPoint files (.ppt, .pptx, .ppsx) are not yet supported. Please convert your presentation to PDF and upload that instead.",
    };
  }

  return {
    slides: [],
    error: "Unsupported file format",
  };
}

async function extractSlidesFromPDF(
  file: File,
  eventId: string,
  supabase: SupabaseClient
): Promise<SlideExtractionResult> {
  try {
    console.log("[extractSlidesFromPDF] Starting PDF extraction");
    
    // Load required libraries
    const pdfjs = await loadPdfJs();
    const createCanvasFn = await loadCanvas();
    
    if (!createCanvasFn) {
      return {
        slides: [],
        error: "PDF extraction requires the canvas library which is not available in this environment. Please convert your PDF to individual images (PNG/JPG) and upload them separately, or contact support to enable PDF extraction.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    console.log("[extractSlidesFromPDF] PDF loaded, size:", arrayBuffer.byteLength);
    
    // Load PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    console.log(`[extractSlidesFromPDF] Processing PDF with ${numPages} pages`);

    const slides: Array<{ url: string; path: string; pageNumber: number }> = [];

    // Extract each page as an image
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality

        // Create canvas
        const pageCanvas = createCanvasFn(viewport.width, viewport.height);
        const context = pageCanvas.getContext("2d");

        // Render PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

        // Convert canvas to buffer
        const imageBuffer = pageCanvas.toBuffer("image/png");

        // Upload image to Supabase storage
        const timestamp = Date.now();
        const fileName = `slide-${timestamp}-${pageNum}.png`;
        const filePath = `${eventId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("slides")
          .upload(filePath, imageBuffer, {
            contentType: "image/png",
            upsert: false,
          });

        if (uploadError) {
          console.error(`Failed to upload slide ${pageNum}:`, uploadError);
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

        console.log(`[extractSlidesFromPDF] Extracted slide ${pageNum}/${numPages}`);
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }

    if (slides.length === 0) {
      return {
        slides: [],
        error: "Failed to extract any slides from the PDF",
      };
    }

    console.log(`[extractSlidesFromPDF] Successfully extracted ${slides.length} slides`);
    return { slides };
  } catch (error) {
    console.error("PDF extraction error:", error);
    return {
      slides: [],
      error: error instanceof Error ? error.message : "Failed to process PDF",
    };
  }
}
