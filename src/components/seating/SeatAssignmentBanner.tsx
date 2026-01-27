"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasUserSeenItem, markItemAsSeen } from "@/lib/supabase/seenItems";
import type { Event } from "@/types";
import { MapPin, Sparkles } from "lucide-react";

interface SeatAssignmentBannerProps {
  event: Event;
  userId: string;
}

interface TableAssignment {
  tableNumber: number;
  groupName: string;
  groupId: string;
}

export function SeatAssignmentBanner({ event, userId }: SeatAssignmentBannerProps) {
  const [assignment, setAssignment] = useState<TableAssignment | null>(null);
  const [isLockoutActive, setIsLockoutActive] = useState(event.seat_lockout_active);
  const [loading, setLoading] = useState(true);
  const [isFirstView, setIsFirstView] = useState(false);
  const hasMarkedAsSeen = useRef(false);

  useEffect(() => {
    async function fetchAssignment() {
      try {
        const response = await fetch(`/api/table-assignment?eventId=${event.id}`);
        if (!response.ok) return;
        const data = await response.json();

        const newAssignment = data.assignment || null;
        setAssignment(newAssignment);

        if (newAssignment) {
          // Check if this is the first time seeing this assignment (using Supabase)
          try {
            const hasSeen = await hasUserSeenItem(userId, "table_assignment", newAssignment.groupId);
            
            if (!hasSeen && !hasMarkedAsSeen.current) {
              setIsFirstView(true);
              hasMarkedAsSeen.current = true;

              // Mark as seen after the animation completes (5 seconds)
              setTimeout(async () => {
                try {
                  await markItemAsSeen(userId, event.id, "table_assignment", newAssignment.groupId);
                } catch (err) {
                  console.error("[SeatAssignmentBanner] Error marking as seen:", err);
                }
                setIsFirstView(false);
              }, 5000);
            }
          } catch (err) {
            console.error("[SeatAssignmentBanner] Error checking seen status:", err);
          }
        }
      } catch (err) {
        console.error("[SeatAssignmentBanner] Table assignment fetch error:", err);
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

    const interval = setInterval(fetchAssignment, 10000);

    return () => {
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(groupChannel);
      clearInterval(interval);
    };
  }, [event.id, userId]);

  // Don't show anything if lockout is not active or user has no assignment
  if (!isLockoutActive || !assignment || loading) {
    return null;
  }

  return (
    <div
      className={`sticky top-0 z-50 text-white shadow-lg relative overflow-hidden transition-all duration-1000 ${
        isFirstView
          ? "bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600"
          : "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600"
      }`}
    >
      {/* First-view illumination effects */}
      {isFirstView && (
        <>
          {/* Animated glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />

          {/* Pulsing border glow */}
          <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(255,255,255,0.3)] animate-pulse" />

          {/* Sparkle particles */}
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles className="absolute top-2 left-[10%] w-4 h-4 text-white/60 animate-ping" style={{ animationDelay: "0ms", animationDuration: "1.5s" }} />
            <Sparkles className="absolute top-3 left-[30%] w-3 h-3 text-white/50 animate-ping" style={{ animationDelay: "300ms", animationDuration: "2s" }} />
            <Sparkles className="absolute bottom-2 left-[50%] w-4 h-4 text-white/60 animate-ping" style={{ animationDelay: "600ms", animationDuration: "1.8s" }} />
            <Sparkles className="absolute top-2 right-[30%] w-3 h-3 text-white/50 animate-ping" style={{ animationDelay: "400ms", animationDuration: "1.6s" }} />
            <Sparkles className="absolute bottom-3 right-[15%] w-4 h-4 text-white/60 animate-ping" style={{ animationDelay: "200ms", animationDuration: "2.2s" }} />
          </div>

          {/* Radial glow from center */}
          <div className="absolute inset-0 bg-radial-glow opacity-50 animate-pulse" style={{ animationDuration: "2s" }} />
        </>
      )}

      <div className="max-w-4xl mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center border-2 transition-all duration-500 ${
                isFirstView
                  ? "bg-white/30 border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-110"
                  : "bg-white/20 border-white/40"
              }`}
            >
              <span className={`text-xl font-bold tabular-nums transition-all duration-500 ${isFirstView ? "scale-110" : ""}`}>
                {assignment.tableNumber}
              </span>
            </div>
            <div className="text-left">
              <p className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-500 ${
                isFirstView ? "text-white/90" : "text-white/70"
              }`}>
                {isFirstView ? "You've Been Assigned!" : "Your Table"}
              </p>
              <p className={`text-lg font-medium tracking-tight transition-all duration-500 ${
                isFirstView ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" : ""
              }`}>
                Table {assignment.tableNumber}
              </p>
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/30" />

          <div className="hidden sm:flex items-center gap-2">
            <MapPin className={`w-4 h-4 transition-colors duration-500 ${isFirstView ? "text-white" : "text-white/70"}`} />
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
