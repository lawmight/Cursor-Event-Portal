"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { SyncedSlideViewer } from "./SyncedSlideViewer";
import { cn } from "@/lib/utils";
import type { SlideDeck } from "@/types";

interface FullscreenSlideViewerProps {
  slideDeck: SlideDeck;
}

export function FullscreenSlideViewer({ slideDeck }: FullscreenSlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  // Listen for fullscreen changes (including Escape key exit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle Escape key in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isFullscreen]);

  return (
    <div className="glass rounded-[40px] p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">
            Synced with presenter
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-[9px] text-green-400 uppercase tracking-wider">Live</p>
          </div>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center group"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "rounded-2xl overflow-hidden bg-black border border-white/5 transition-all",
          isFullscreen
            ? "fixed inset-0 z-[9999] rounded-none border-none flex items-center justify-center"
            : "aspect-video"
        )}
      >
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-6 right-6 z-50 w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80 transition-all flex items-center justify-center group"
            title="Exit fullscreen (Esc)"
          >
            <Minimize2 className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>
        )}

        <SyncedSlideViewer
          slideDeck={slideDeck}
          className={cn(
            "w-full h-full",
            isFullscreen && "max-w-[95vw] max-h-[95vh]"
          )}
        />

        {isFullscreen && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 border border-white/20">
            <p className="text-[10px] text-white/50 uppercase tracking-wider">
              Press ESC or click minimize to exit
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
