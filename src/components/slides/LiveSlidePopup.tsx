"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Slide } from "@/types";

interface LiveSlidePopupProps {
  eventId: string;
  eventSlug: string;
}

export function LiveSlidePopup({ eventId, eventSlug }: LiveSlidePopupProps) {
  const pathname = usePathname();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show popup on the slides page itself
  const isOnSlidesPage = pathname?.includes("/slides");

  // Fetch all slides and find live one
  useEffect(() => {
    const fetchSlides = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("slides")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) {
        setSlides(data);
        // Find the live slide index
        const liveIndex = data.findIndex((s: Slide) => s.is_live);
        if (liveIndex >= 0) {
          setCurrentIndex(liveIndex);
          setIsDismissed(false); // Show popup when slide goes live
        }
      } else {
        setSlides([]);
      }
    };

    fetchSlides();

    // Subscribe to slide changes
    const supabase = createClient();
    const channel = supabase
      .channel(`live-slide-popup-${eventId}`)
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

  // Check if any slide is live
  const hasLiveSlide = slides.some((s) => s.is_live);
  const currentSlide = slides[currentIndex];

  // Don't render if on slides page, no live slide, or dismissed
  if (isOnSlidesPage || !hasLiveSlide || isDismissed || !currentSlide) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 glass rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all group shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded-lg overflow-hidden bg-white/10 relative">
            <Image
              src={currentSlide.image_url}
              alt="Slide preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-wider text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </p>
            <p className="text-[10px] text-gray-400">View slides</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 w-80 glass rounded-[32px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-green-400 font-medium">
            Live Slides
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

      {/* Slide Content */}
      <div className="p-4">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/5">
          <Image
            src={currentSlide.image_url}
            alt={currentSlide.title || `Slide ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="320px"
            priority
            unoptimized
          />
        </div>

        {/* Navigation */}
        {slides.length > 1 && (
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={goToPrevious}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    idx === currentIndex
                      ? "bg-white w-4"
                      : slide.is_live
                      ? "bg-green-400"
                      : "bg-white/20 hover:bg-white/40"
                  )}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Slide info */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-gray-500">
            {currentIndex + 1} of {slides.length}
            {currentSlide.title && (
              <span className="text-gray-400"> &middot; {currentSlide.title}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
