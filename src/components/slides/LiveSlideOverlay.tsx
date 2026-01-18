"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Slide } from "@/types";

interface LiveSlideOverlayProps {
  slide: Slide;
}

export function LiveSlideOverlay({ slide }: LiveSlideOverlayProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300",
        isMaximized
          ? "inset-0 bg-black/95 backdrop-blur-sm"
          : "bottom-24 right-6 w-96"
      )}
    >
      <div
        className={cn(
          "relative flex flex-col",
          isMaximized ? "h-full p-8" : "glass rounded-3xl overflow-hidden"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between gap-4 flex-shrink-0",
          isMaximized ? "mb-6" : "p-4 bg-black/40 backdrop-blur-sm"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-green-400 font-medium">
              Live Presentation
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
              title="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Slide Content */}
        <div className={cn(
          "relative flex-1 bg-black",
          isMaximized ? "rounded-2xl" : "aspect-video"
        )}>
          <Image
            src={slide.image_url}
            alt={slide.title || "Live Slide"}
            fill
            className="object-contain"
            sizes={isMaximized ? "100vw" : "384px"}
            priority
          />
        </div>

        {/* Title */}
        {slide.title && !isMaximized && (
          <div className="p-4 bg-black/40 backdrop-blur-sm">
            <p className="text-sm font-light text-white/90 truncate">
              {slide.title}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

