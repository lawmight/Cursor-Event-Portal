"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatTime, isNow, isNext } from "@/lib/utils";
import type { AgendaItem } from "@/types";
import { Clock, MapPin, User } from "lucide-react";

interface AgendaListProps {
  items: AgendaItem[];
}

export function AgendaList({ items }: AgendaListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No agenda items yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        const isCurrentlyNow = isNow(item.start_time, item.end_time);
        const isUpNext = isNext(
          item.start_time,
          items.map((i) => ({ start_time: i.start_time, end_time: i.end_time }))
        );

        return (
          <div
            key={item.id}
            className={`glass rounded-[32px] p-8 transition-all duration-500 animate-slide-up relative overflow-hidden group ${
              isCurrentlyNow
                ? "border-white/20 bg-white/[0.05]"
                : "border-white/5 bg-white/[0.01]"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {isCurrentlyNow && (
              <div className="absolute top-0 right-0 p-4">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`text-[11px] font-medium uppercase tracking-[0.3em] ${
                    isCurrentlyNow 
                      ? "text-white" 
                      : "text-gray-600"
                  }`}>
                    {isCurrentlyNow ? "Ongoing" : isUpNext ? "Up Next" : formatTime(item.start_time || "")}
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-700 font-medium">
                      <MapPin className="w-3 h-3 opacity-30" />
                      {item.location}
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-light text-white tracking-tight group-hover:translate-x-1 transition-transform">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-sm text-gray-500 font-light leading-relaxed max-w-md">
                    {item.description}
                  </p>
                )}

                {item.speaker && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em]">
                      {item.speaker}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
