"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SeriesEvent {
  id: string;
  slug: string;
  name: string;
  start_time: string | null;
  venue: string | null;
  status: string;
}

interface EventSeriesSectionProps {
  currentEventId: string;
  seriesEvents: SeriesEvent[];
}

function formatDate(dateString: string | null) {
  if (!dateString) return "TBD";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStatusStyle(status: string) {
  if (status === "completed") {
    return "bg-white/10 text-gray-400";
  }
  if (status === "active") {
    return "bg-green-500/10 text-green-400";
  }
  return "bg-white/5 text-white";
}

export function EventSeriesSection({ currentEventId, seriesEvents }: EventSeriesSectionProps) {
  if (seriesEvents.length === 0) return null;

  return (
    <div className="glass rounded-[36px] p-6 border border-white/10 animate-slide-up" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium">
          Series
        </p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {seriesEvents.map((event) => {
          const isCurrent = event.id === currentEventId;
          return (
            <Link
              key={event.id}
              href={`/${event.slug}/agenda`}
              className={cn(
                "min-w-[220px] rounded-2xl p-4 border transition-all",
                isCurrent
                  ? "border-white/40 bg-white/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">
                  {formatDate(event.start_time)}
                </span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[9px] uppercase tracking-[0.3em]",
                  getStatusStyle(event.status)
                )}>
                  {event.status === "completed" ? "Completed" : event.status === "active" ? "Active" : "Upcoming"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <h3 className="text-lg font-light text-white tracking-tight">
                  {event.name}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  {event.venue || "Venue TBA"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
