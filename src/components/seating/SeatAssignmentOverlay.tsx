"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/types";

interface SeatAssignmentOverlayProps {
  event: Event;
  userId: string;
}

interface TableAssignment {
  tableNumber: number;
  groupName: string;
}

export function SeatAssignmentOverlay({ event, userId }: SeatAssignmentOverlayProps) {
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

    // Subscribe to group changes (in case they get approved while user is viewing)
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
          // Re-fetch assignment when groups change
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
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-indigo-900/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[100px] animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-8 max-w-2xl mx-auto">
        {/* Table Number - Large and prominent */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-48 h-48 rounded-full bg-white/10 border-4 border-white/30 backdrop-blur-sm shadow-[0_0_80px_rgba(255,255,255,0.2)]">
            <span className="text-8xl font-light text-white tabular-nums">
              {assignment.tableNumber}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-6">
          Please Find Your Seat
        </h1>
        
        <p className="text-xl md:text-2xl text-white/80 font-light tracking-wide mb-8">
          at <span className="text-white font-medium">Table {assignment.tableNumber}</span>
        </p>

        {/* Group name */}
        <div className="inline-block px-8 py-4 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/60 font-medium mb-1">
            Your Group
          </p>
          <p className="text-lg text-white/90 font-light tracking-tight">
            {assignment.groupName}
          </p>
        </div>

        {/* Subtle indicator */}
        <p className="mt-16 text-[10px] uppercase tracking-[0.5em] text-white/30 font-medium animate-pulse">
          Waiting for event to begin...
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
