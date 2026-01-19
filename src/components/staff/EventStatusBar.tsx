"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AgendaItem, Event } from "@/types";
import { formatTime } from "@/lib/utils";
import { Clock, Radio } from "lucide-react";

interface EventStatusBarProps {
  event: Event;
  initialAgendaItems: AgendaItem[];
  eventId: string;
}

type EventStatus = 
  | "pre-event"
  | "doors-open"
  | "live"
  | "networking"
  | "talk-in-progress"
  | "afterparty"
  | "ended";

function getEventStatus(
  agendaItems: AgendaItem[],
  eventStartTime: string | null
): { status: EventStatus; currentItem: AgendaItem | null; label: string } {
  const now = new Date();
  const eventStart = eventStartTime ? new Date(eventStartTime) : null;

  // If event hasn't started yet
  if (eventStart && now < eventStart) {
    return { status: "pre-event", currentItem: null, label: "Pre-Event" };
  }

  // Find current agenda item
  let currentItem: AgendaItem | null = null;
  for (const item of agendaItems) {
    if (item.start_time && item.end_time) {
      const start = new Date(item.start_time);
      const end = new Date(item.end_time);
      if (now >= start && now <= end) {
        currentItem = item;
        break;
      }
    }
  }

  if (!currentItem) {
    // Check if event has ended (all items are past)
    const lastItem = agendaItems[agendaItems.length - 1];
    if (lastItem?.end_time && new Date(lastItem.end_time) < now) {
      return { status: "ended", currentItem: null, label: "Event Ended" };
    }
    return { status: "pre-event", currentItem: null, label: "Pre-Event" };
  }

  // Determine status based on agenda item title/keywords
  const title = currentItem.title.toLowerCase();
  
  if (title.includes("mingling") || title.includes("networking") || title.includes("doors")) {
    return { status: "doors-open", currentItem, label: "Doors Open" };
  }
  
  if (title.includes("networking") && !title.includes("mingling")) {
    return { status: "networking", currentItem, label: "Networking" };
  }
  
  if (title.includes("talk") || title.includes("presentation") || title.includes("demo") || title.includes("speaker")) {
    return { status: "talk-in-progress", currentItem, label: "Talk in Progress" };
  }
  
  if (title.includes("afterparty") || title.includes("after party")) {
    return { status: "afterparty", currentItem, label: "Afterparty" };
  }
  
  // Default to "Live" for any active session
  return { status: "live", currentItem, label: "Live" };
}

export function EventStatusBar({ event, initialAgendaItems, eventId }: EventStatusBarProps) {
  const [agendaItems, setAgendaItems] = useState(initialAgendaItems);
  const [statusInfo, setStatusInfo] = useState(() => 
    getEventStatus(initialAgendaItems, event.start_time)
  );

  // Subscribe to real-time agenda updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-status-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agenda_items",
          filter: `event_id=eq.${eventId}`,
        },
        async () => {
          // Fetch updated agenda items
          const { data } = await supabase
            .from("agenda_items")
            .select("*")
            .eq("event_id", eventId)
            .order("sort_order", { ascending: true });
          if (data) {
            setAgendaItems(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Update status every 30 seconds
  useEffect(() => {
    setStatusInfo(getEventStatus(agendaItems, event.start_time));
    const interval = setInterval(() => {
      setStatusInfo(getEventStatus(agendaItems, event.start_time));
    }, 30000);

    return () => clearInterval(interval);
  }, [agendaItems, event.start_time]);

  const statusColors: Record<EventStatus, string> = {
    "pre-event": "bg-gray-500/20 border-gray-500/30 text-gray-400",
    "doors-open": "bg-green-500/20 border-green-500/30 text-green-400",
    "live": "bg-blue-500/20 border-blue-500/30 text-blue-400",
    "networking": "bg-purple-500/20 border-purple-500/30 text-purple-400",
    "talk-in-progress": "bg-orange-500/20 border-orange-500/30 text-orange-400",
    "afterparty": "bg-pink-500/20 border-pink-500/30 text-pink-400",
    "ended": "bg-gray-500/20 border-gray-500/30 text-gray-400",
  };

  const statusColor = statusColors[statusInfo.status];

  return (
    <div className={`glass rounded-[32px] p-6 border ${statusColor} transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] font-medium opacity-70 mb-1">
              Event Status
            </p>
            <p className="text-xl font-light tracking-tight">
              {statusInfo.label}
            </p>
            {statusInfo.currentItem && (
              <p className="text-[10px] text-gray-500 mt-1">
                {statusInfo.currentItem.title}
              </p>
            )}
          </div>
        </div>
        {statusInfo.currentItem && statusInfo.currentItem.end_time && (
          <div className="text-right">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                Until {formatTime(statusInfo.currentItem.end_time, event.timezone)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
