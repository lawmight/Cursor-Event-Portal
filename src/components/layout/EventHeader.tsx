"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Event, Announcement } from "@/types";
import { cn } from "@/lib/utils";
import { EventTimer } from "@/components/timer/EventTimer";
import { createClient } from "@/lib/supabase/client";
import { MapPin } from "lucide-react";

interface EventHeaderProps {
  event: Event;
  announcement?: Announcement | null;
  showTimer?: boolean;
  userId?: string;
}

interface TableAssignment {
  tableNumber: number;
  groupName: string;
}

export function EventHeader({ event, announcement: initialAnnouncement, showTimer = true, userId }: EventHeaderProps) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(initialAnnouncement || null);
  const [tableAssignment, setTableAssignment] = useState<TableAssignment | null>(null);

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

  // Fetch table assignment if userId is provided
  useEffect(() => {
    if (!userId) return;

    async function fetchTableAssignment() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("suggested_group_members")
        .select(`
          group:suggested_groups(
            id,
            name,
            table_number,
            status
          )
        `)
        .eq("user_id", userId)
        .single();

      if (!error && data?.group) {
        const group = data.group as any;
        if (group.status === "approved" && group.table_number) {
          setTableAssignment({
            tableNumber: group.table_number,
            groupName: group.name,
          });
        }
      }
    }

    fetchTableAssignment();

    // Subscribe to group changes
    const supabase = createClient();
    const groupChannel = supabase
      .channel(`group-assignment-header-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "suggested_groups",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          fetchTableAssignment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupChannel);
    };
  }, [event.id, userId]);

  // Event opens at 5:00 PM MST on Jan 28, 2026 = 2026-01-29T00:00:00Z (midnight UTC on Jan 29)
  // Event starts at 5:30 PM MST = 2026-01-29T00:30:00Z
  // Event ends at 8:30 PM MST = 2026-01-29T03:30:00Z
  // Red threshold at 8:30 PM = 3 hours from start = 180 minutes
  const eventStartTime = "2026-01-29T00:00:00Z";
  const redThreshold = 180; // 3 hours = 8:30 PM

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

          {/* Table Assignment */}
          {tableAssignment && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
              <MapPin className="w-3 h-3 text-white/70" />
              <span className="text-xs font-medium text-white">
                Table {tableAssignment.tableNumber}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
