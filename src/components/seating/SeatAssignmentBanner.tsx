"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/types";
import { MapPin } from "lucide-react";

interface SeatAssignmentBannerProps {
  event: Event;
  userId: string;
}

interface TableAssignment {
  tableNumber: number;
  groupName: string;
}

export function SeatAssignmentBanner({ event, userId }: SeatAssignmentBannerProps) {
  const [assignment, setAssignment] = useState<TableAssignment | null>(null);
  const [isLockoutActive, setIsLockoutActive] = useState(event.seat_lockout_active);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignment() {
      const supabase = createClient();
      
      // Get user's approved group with table assignment
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
          setAssignment({
            tableNumber: group.table_number,
            groupName: group.name,
          });
        }
      }
      setLoading(false);
    }

    fetchAssignment();

    // Subscribe to event changes for lockout status
    const supabase = createClient();
    const eventChannel = supabase
      .channel(`event-lockout-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${event.id}`,
        },
        (payload) => {
          const newEvent = payload.new as Event;
          setIsLockoutActive(newEvent.seat_lockout_active);
        }
      )
      .subscribe();

    // Subscribe to group changes
    const groupChannel = supabase
      .channel(`group-assignment-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "suggested_groups",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          fetchAssignment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(groupChannel);
    };
  }, [event.id, userId]);

  // Don't show anything if lockout is not active or user has no assignment
  if (!isLockoutActive || !assignment || loading) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
              <span className="text-xl font-bold tabular-nums">{assignment.tableNumber}</span>
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-medium">
                Your Table
              </p>
              <p className="text-lg font-medium tracking-tight">
                Table {assignment.tableNumber}
              </p>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-10 bg-white/30" />
          
          <div className="hidden sm:flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/90">{assignment.groupName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to check if lockout is active (for disabling nav items)
export function useSeatLockout(event: Event) {
  const [isLockoutActive, setIsLockoutActive] = useState(event.seat_lockout_active);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-lockout-check-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${event.id}`,
        },
        (payload) => {
          const newEvent = payload.new as Event;
          setIsLockoutActive(newEvent.seat_lockout_active);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id]);

  return isLockoutActive;
}
