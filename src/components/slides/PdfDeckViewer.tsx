"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from "pdfjs-dist";

interface PdfDeckViewerProps {
  pdfUrl: string;
  className?: string;
  initialPage?: number;
  showControls?: boolean;
  onPageCount?: (count: number) => void;
  onPageChange?: (page: number) => void;
  syncedPage?: number; // When provided, viewer syncs to this page (for attendees)
}

export function PdfDeckViewer({
  pdfUrl,
  className,
  initialPage = 1,
  showControls = true,
  onPageCount,
  onPageChange,
  syncedPage,
}: PdfDeckViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [isRendering, setIsRendering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfUrl) return;

    const configureWorker = () => {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        const version = pdfjsLib.version;
        if (!version) {
          console.error("Unable to determine pdfjs-dist version for worker setup");
          return;
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      }
    };

    configureWorker();

    let isMounted = true;
    const loadPdf = async () => {
      try {
        setLoadError(null);
        const doc = await pdfjsLib.getDocument(pdfUrl).promise;
        if (!isMounted) return;
        setPdfDoc(doc);
        setPageCount(doc.numPages);
        onPageCount?.(doc.numPages);
        setPageNumber((prev) => Math.min(Math.max(prev, 1), doc.numPages));
      } catch (error) {
        if (!isMounted) return;
        setLoadError("Failed to load PDF deck.");
        setPdfDoc(null);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      setPdfDoc(null);
    };
  }, [pdfUrl, onPageCount]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        setIsRendering(true);
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.875 }); // 1.5 * 1.25 = 1.875 (25% larger)
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvas: null,
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport,
        }).promise;
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();
  }, [pdfDoc, pageNumber]);

  // Sync to external page control (for attendees following admin)
  useEffect(() => {
    if (syncedPage !== undefined && syncedPage !== pageNumber && syncedPage >= 1 && syncedPage <= pageCount) {
      setPageNumber(syncedPage);
    }
  }, [syncedPage, pageCount]);

  const handlePrev = () => {
    const newPage = Math.max(pageNumber - 1, 1);
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  const handleNext = () => {
    const newPage = Math.min(pageNumber + 1, pageCount);
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  if (loadError) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center text-sm text-red-400", className)}>
        {loadError}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div className="w-full h-full flex items-center justify-center">
        <canvas ref={canvasRef} className="max-w-full max-h-full rounded-2xl shadow-2xl" />
      </div>

      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
          <Loader2 className="w-6 h-6 text-white/80 animate-spin" />
        </div>
      )}

      {showControls && pageCount > 1 && (
        <>
          <button
            onClick={handlePrev}
            disabled={pageNumber === 1}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center disabled:opacity-40"
          >
            <ChevronLeft className="w-6 h-6 text-white/70" />
          </button>
          <button
            onClick={handleNext}
            disabled={pageNumber === pageCount}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center disabled:opacity-40"
          >
            <ChevronRight className="w-6 h-6 text-white/70" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 border border-white/20 text-xs text-white/70">
            {pageNumber} / {pageCount}
          </div>
        </>
      )}
    </div>
  );
}
