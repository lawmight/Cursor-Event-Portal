"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PdfDeckViewer } from "./PdfDeckViewer";
import type { SlideDeck } from "@/types";

interface SyncedSlideViewerProps {
  slideDeck: SlideDeck;
  className?: string;
}

export function SyncedSlideViewer({ slideDeck, className }: SyncedSlideViewerProps) {
  const [currentPage, setCurrentPage] = useState(slideDeck.current_page || 1);

  // Subscribe to current_page changes from admin
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`slide-sync-${slideDeck.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "slide_decks",
          filter: `id=eq.${slideDeck.id}`,
        },
        (payload) => {
          const updated = payload.new as SlideDeck;
          if (updated.current_page) {
            setCurrentPage(updated.current_page);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slideDeck.id]);

  return (
    <PdfDeckViewer
      pdfUrl={slideDeck.pdf_url}
      className={className}
      showControls={false}
      syncedPage={currentPage}
    />
  );
}
