"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DisplayPageData } from "@/types";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface EventDisplayProps {
  initialData: DisplayPageData;
  eventSlug: string;
  refreshInterval?: number;
}

export function EventDisplay({
  initialData,
  eventSlug,
  refreshInterval = 30000,
}: EventDisplayProps) {
  const [data, setData] = useState(initialData);
  const [countdown, setCountdown] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSlides, setShowSlides] = useState(data.slides.length > 0);

  // Subscribe to real-time announcement updates
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`announcements-display-${initialData.event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
          filter: `event_id=eq.${initialData.event.id}`,
        },
        async () => {
          // Refresh announcements when they change
          try {
            const res = await fetch(`/api/display/${eventSlug}`);
            if (res.ok) {
              const newData = await res.json();
              setData((prev) => ({
                ...prev,
                announcements: newData.announcements,
              }));
            }
          } catch (error) {
            console.error("Failed to refresh announcements");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventSlug, initialData.event.id]);

  // Refresh data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/display/${eventSlug}`);
        if (res.ok) {
          const newData = await res.json();
          setData(newData);
          // If slides are available, show slides view
          if (newData.slides && newData.slides.length > 0) {
            setShowSlides(true);
          }
        }
      } catch (error) {
        console.error("Failed to refresh display data");
      }
    };

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [eventSlug, refreshInterval]);

  // Auto-advance slides every 10 seconds
  useEffect(() => {
    if (!showSlides || data.slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % data.slides.length);
    }, 10000); // 10 seconds per slide

    return () => clearInterval(interval);
  }, [showSlides, data.slides.length]);

  // Update countdown and current time every second
  useEffect(() => {
    const updateCountdown = () => {
      setCurrentTime(new Date());

      if (!data.nextSession?.start_time) {
        setCountdown("");
        return;
      }

      const now = new Date();
      const start = new Date(data.nextSession.start_time);
      const diff = start.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Starting now!");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data.nextSession]);

  // Calculate progress for current session
  const getSessionProgress = (): number => {
    if (!data.currentSession?.start_time || !data.currentSession?.end_time) {
      return 0;
    }
    const now = new Date().getTime();
    const start = new Date(data.currentSession.start_time).getTime();
    const end = new Date(data.currentSession.end_time).getTime();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % data.slides.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + data.slides.length) % data.slides.length);
  };

  // Show slides in full screen if available
  if (showSlides && data.slides.length > 0) {
    const currentSlide = data.slides[currentSlideIndex];

    return (
      <div className="min-h-screen bg-black text-white relative flex items-center justify-center">
        {/* Slide Image */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <Image
            src={currentSlide.image_url}
            alt={currentSlide.title || `Slide ${currentSlideIndex + 1}`}
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
        </div>

        {/* Navigation Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center group"
        >
          <ChevronLeft className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-16 h-16 rounded-full glass border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center group"
        >
          <ChevronRight className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
        </button>

        {/* Slide Counter */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-6 py-3 border border-white/20">
          <div className="flex items-center gap-4">
            <span className="text-sm font-light tabular-nums text-white/70">
              {currentSlideIndex + 1} / {data.slides.length}
            </span>
            <div className="flex items-center gap-2">
              {data.slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentSlideIndex
                      ? "bg-white w-8"
                      : "bg-white/30 hover:bg-white/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Toggle to Dashboard View */}
        <button
          onClick={() => setShowSlides(false)}
          className="absolute top-8 right-8 z-50 glass rounded-2xl px-6 py-3 border border-white/20 hover:bg-white/10 transition-all text-sm text-white/70 hover:text-white"
        >
          Show Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-gradient text-white p-12 flex flex-col relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="mb-20 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-black shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              C
            </div>
            <div className="text-left space-y-1">
              <h1 className="text-6xl font-light tracking-tight">{data.event.name}</h1>
              <p className="text-[14px] uppercase tracking-[0.6em] text-gray-400 font-medium">{data.event.venue}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <time className="text-6xl font-light tracking-tight tabular-nums">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
              })}
            </time>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-medium">System Active</p>
          </div>
        </div>
      </header>

      {/* Toggle to Slides View */}
      {data.slides.length > 0 && (
        <button
          onClick={() => setShowSlides(true)}
          className="absolute top-8 right-8 z-50 glass rounded-2xl px-6 py-3 border border-white/20 hover:bg-white/10 transition-all text-sm text-white/70 hover:text-white"
        >
          Show Slides ({data.slides.length})
        </button>
      )}

      <div className="grid grid-cols-12 gap-16 flex-1 z-10">
        {/* Left Side: Sessions */}
        <div className="col-span-8 space-y-16">
          {/* Now Playing */}
          <div className="glass rounded-[56px] p-16 relative overflow-hidden group border-white/20">
            {data.currentSession ? (
              <div className="space-y-12">
                <div className="flex items-center gap-6">
                  <div className="px-5 py-2 rounded-full border border-white/20 text-white text-[11px] font-medium uppercase tracking-[0.4em]">
                    Now
                  </div>
                  <div className="h-[1px] flex-1 bg-white/20" />
                </div>
                
                <div className="space-y-6">
                  <h2 className="text-8xl font-light tracking-tight leading-[1.1] text-shadow-glow">{data.currentSession.title}</h2>
                  {data.currentSession.speaker && (
                    <p className="text-4xl text-gray-300 font-light tracking-tight">
                      {data.currentSession.speaker}
                    </p>
                  )}
                </div>

                {/* Progress bar - Ultra Minimal */}
                <div className="pt-12">
                  <div className="h-[2px] bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      style={{ width: `${getSessionProgress()}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center py-32 opacity-20">
                <p className="text-4xl font-light tracking-[0.2em] uppercase">Intermission</p>
              </div>
            )}
          </div>

          {/* Up Next & Announcements */}
          <div className="grid grid-cols-2 gap-16">
            {data.nextSession && (
              <div className="glass rounded-[48px] p-12 space-y-8 border-white/20">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-medium uppercase tracking-[0.4em] text-gray-400">
                    Up Next
                  </div>
                  <div className="text-2xl font-light tracking-tight text-white/70 tabular-nums">
                    {countdown}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-light tracking-tight leading-tight">{data.nextSession.title}</h3>
                  {data.nextSession.speaker && (
                    <p className="text-gray-400 font-medium uppercase tracking-[0.3em] text-[10px]">{data.nextSession.speaker}</p>
                  )}
                </div>
              </div>
            )}

            {data.announcements.length > 0 && (
              <div className="glass rounded-[48px] p-12 bg-white/5 border-white/20">
                <div className="text-[10px] font-medium uppercase tracking-[0.4em] text-gray-400 mb-8">
                  Bulletin
                </div>
                <div className="space-y-6">
                  {data.announcements.slice(0, 2).map((announcement) => (
                    <p key={announcement.id} className="text-2xl font-light leading-relaxed tracking-tight text-white/90">
                      {announcement.content}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Q&A */}
        <div className="col-span-4 flex flex-col space-y-12">
          <div className="flex items-center gap-6 px-6">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.5em] text-gray-400">Live Stream</h3>
            <div className="h-[1px] flex-1 bg-white/20" />
          </div>

          <div className="flex-1 space-y-8 overflow-hidden">
            {data.recentQuestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-6">
                <div className="w-20 h-20 rounded-full border border-white flex items-center justify-center font-light text-4xl">
                  ?
                </div>
                <p className="text-[10px] font-medium uppercase tracking-[0.5em]">Waiting for input</p>
              </div>
            ) : (
              <div className="space-y-8 animate-slide-up">
                {data.recentQuestions.slice(0, 4).map((question) => (
                  <div key={question.id} className="glass rounded-[40px] p-10 space-y-6 border-white/20 hover:bg-white/10 transition-colors">
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-[1px] h-6 bg-gradient-to-t from-white/60 to-transparent" />
                        <span className="text-2xl font-light tabular-nums">{question.upvotes}</span>
                      </div>
                      <div className="flex-1 space-y-4">
                        <p className="text-2xl font-light tracking-tight leading-relaxed">{question.content}</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium">
                          {question.user?.name || "Anonymous"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-20 py-10 border-t border-white/20 flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up Calgary / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Event Portal</p>
          <span className="text-[10px] font-medium text-white/70 px-5 py-2 bg-white/10 rounded-full border border-white/20">luma.com/cursor</span>
        </div>
      </footer>
    </div>
  );
}
