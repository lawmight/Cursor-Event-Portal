"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, Maximize2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PdfDeckViewer } from "./PdfDeckViewer";
import type { SlideDeck } from "@/types";

interface SlideDeckPopupProps {
  eventId: string;
  eventSlug: string;
}

export function SlideDeckPopup({ eventId, eventSlug }: SlideDeckPopupProps) {
  const pathname = usePathname();
  const [slideDeck, setSlideDeck] = useState<SlideDeck | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show popup on the slides page itself
  const isOnSlidesPage = pathname?.includes("/slides");

  // Fetch slide deck
  useEffect(() => {
    const fetchSlideDeck = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("slide_decks")
        .select("*")
        .eq("event_id", eventId)
        .eq("popup_visible", true)
        .single();

      if (data) {
        setSlideDeck(data);
        setIsDismissed(false); // Show popup when enabled
      } else {
        setSlideDeck(null);
      }
    };

    fetchSlideDeck();

    // Subscribe to slide deck changes
    const supabase = createClient();
    const channel = supabase
      .channel(`slide-deck-popup-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "slide_decks",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          // Directly update state from payload for efficiency
          const updated = payload.new as SlideDeck;
          setSlideDeck((prev) => prev ? { ...prev, ...updated } : null);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "slide_decks",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          setSlideDeck(null);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "slide_decks",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchSlideDeck();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Don't render if on slides page, no slide deck, popup not visible, or dismissed
  if (isOnSlidesPage || !slideDeck || !slideDeck.popup_visible || isDismissed) {
    return null;
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 glass rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all group shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded-lg overflow-hidden bg-white/10 relative flex items-center justify-center">
            <div className="text-[8px] text-gray-400">PDF</div>
          </div>
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-wider text-blue-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Slides
            </p>
            <p className="text-[10px] text-gray-400">View deck</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 w-[368px] glass rounded-[32px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-blue-400 font-medium">
            Slide Deck
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/${eventSlug}/slides`}
            className="w-7 h-7 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center text-gray-500 hover:text-white"
            title="Full screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setIsMinimized(true)}
            className="w-7 h-7 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center text-gray-500 hover:text-white"
            title="Minimize"
          >
            <div className="w-3 h-0.5 bg-current rounded-full" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="w-7 h-7 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center text-gray-500 hover:text-white"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slide Deck Content */}
      <div className="p-4">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/5">
          <PdfDeckViewer
            pdfUrl={slideDeck.pdf_url}
            className="w-full h-full"
            showControls={false}
            syncedPage={slideDeck.current_page || 1}
          />
        </div>

        {/* Deck info */}
        {slideDeck.page_count && (
          <div className="mt-3 text-center">
            <p className="text-[10px] text-gray-500">
              {slideDeck.page_count} {slideDeck.page_count === 1 ? "page" : "pages"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
