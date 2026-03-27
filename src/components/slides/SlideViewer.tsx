"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Slide } from "@/types";

interface SlideViewerProps {
  slides: Slide[];
  eventId: string;
}

export function SlideViewer({ slides: initialSlides, eventId }: SlideViewerProps) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Start at the live slide if there is one
    const liveIndex = initialSlides.findIndex((s) => s.is_live);
    return liveIndex >= 0 ? liveIndex : 0;
  });

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  }, [slides.length]);

  // Subscribe to slide changes
  useEffect(() => {
    const supabase = createClient();

    const fetchSlides = async () => {
      const { data } = await supabase
        .from("slides")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });

      if (data) {
        setSlides(data);
        // Jump to live slide when it changes
        const liveIndex = data.findIndex((s: Slide) => s.is_live);
        if (liveIndex >= 0) {
          setCurrentIndex(liveIndex);
        }
      }
    };

    const channel = supabase
      .channel(`slide-viewer-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slides",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchSlides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const currentSlide = slides[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious]);

  if (!currentSlide) {
    return null;
  }

  return (
    <div className="glass rounded-[40px] p-6 border-white/3">
      {/* Main slide display */}
      <div className="relative aspect-video rounded-[28px] overflow-hidden bg-black/40 border border-white/10">
        <Image
          src={currentSlide.image_url}
          alt={currentSlide.title || `Slide ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 1280px) 100vw, 1280px"
          priority
          unoptimized
        />

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xs border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all flex items-center justify-center text-white/70 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xs border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all flex items-center justify-center text-white/70 hover:text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Live indicator */}
        {currentSlide.is_live && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 backdrop-blur-xs border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-green-400 font-medium">
              Live
            </span>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="mt-6 flex items-center justify-between">
        {/* Slide info */}
        <div>
          {currentSlide.title && (
            <p className="text-sm font-light text-white/90">{currentSlide.title}</p>
          )}
          <p className="text-[10px] text-gray-500 mt-1">
            Slide {currentIndex + 1} of {slides.length}
          </p>
        </div>

        {/* Dot navigation */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === currentIndex
                    ? "bg-white w-6"
                    : slide.is_live
                    ? "bg-green-400 w-2"
                    : "bg-white/20 hover:bg-white/40 w-2"
                )}
              />
            ))}
          </div>
        )}

        {/* Keyboard hint */}
        <p className="text-[9px] text-gray-600">
          Use <kbd className="px-1 py-0.5 rounded-sm bg-white/5 text-gray-500">←</kbd>{" "}
          <kbd className="px-1 py-0.5 rounded-sm bg-white/5 text-gray-500">→</kbd> keys
        </p>
      </div>
    </div>
  );
}
