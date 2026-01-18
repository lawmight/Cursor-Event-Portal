"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Event, Announcement } from "@/types";
import { cn } from "@/lib/utils";
import { EventTimer } from "@/components/timer/EventTimer";
import { createClient } from "@/lib/supabase/client";

interface EventHeaderProps {
  event: Event;
  announcement?: Announcement | null;
  showTimer?: boolean;
}

export function EventHeader({ event, announcement: initialAnnouncement, showTimer = true }: EventHeaderProps) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(initialAnnouncement || null);

  // Auto-refresh every 60 seconds to catch any updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [router]);

  // Subscribe to real-time announcement updates
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`announcements-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
          filter: `event_id=eq.${event.id}`,
        },
        async (payload) => {
          // Fetch the new announcement
          const { data: newAnnouncement } = await supabase
            .from("announcements")
            .select("*")
            .eq("id", payload.new.id)
            .single();
          
          if (newAnnouncement) {
            setAnnouncement(newAnnouncement);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "announcements",
          filter: `event_id=eq.${event.id}`,
        },
        async (payload) => {
          // Fetch the updated announcement
          const { data: updatedAnnouncement } = await supabase
            .from("announcements")
            .select("*")
            .eq("id", payload.new.id)
            .single();
          
          if (updatedAnnouncement) {
            setAnnouncement(updatedAnnouncement);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id]);

  // Event starts at 5:00 PM MST on Jan 28, 2026 = 2026-01-29T00:00:00Z (midnight UTC on Jan 29)
  // Red threshold at 8:30 PM = 3.5 hours = 210 minutes
  const eventStartTime = "2026-01-29T00:00:00Z";
  const redThreshold = 210; // 3.5 hours = 8:30 PM

  return (
    <header className="sticky top-0 z-40">
      {showTimer && <EventTimer startTime={eventStartTime} redThreshold={redThreshold} />}
      {/* Announcement Banner */}
      {announcement && (
        <div className="bg-white text-black px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-center font-bold animate-fade-in">
          {announcement.content}
        </div>
      )}

      {/* Main Header */}
      <div className="glass border-b border-white/5 py-4 backdrop-blur-3xl">
        <div className="max-w-lg mx-auto px-6 flex items-center justify-between">
          <Link href={`/${event.slug}`} className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl group-hover:scale-110 transition-all flex items-center justify-center">
              <Image
                src="/cursor-calgary.avif"
                alt="Cursor Calgary"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-white text-sm leading-tight tracking-tight">
                {event.name}
              </span>
              {event.venue && (
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-medium leading-tight mt-1">
                  {event.venue}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
