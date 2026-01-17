"use client";

import { useState } from "react";
import { formatTime, isNow, isNext } from "@/lib/utils";
import type { AgendaItem } from "@/types";
import { MapPin, User, X, ChevronRight, Clock } from "lucide-react";
import { AgendaItemTimer } from "@/components/timer/AgendaItemTimer";

interface AgendaListProps {
  items: AgendaItem[];
}

interface AgendaItemDetails {
  summary?: string;
  details?: string;
  tips?: string[];
}

// Parse description to extract structured details
function parseDescription(description: string | null): AgendaItemDetails {
  if (!description) return {};

  // Check if description contains structured data (JSON-like format)
  try {
    if (description.startsWith("{")) {
      return JSON.parse(description);
    }
  } catch {
    // Not JSON, use as plain text
  }

  return { summary: description };
}

export function AgendaList({ items }: AgendaListProps) {
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No agenda items yet. Check back soon!
        </p>
      </div>
    );
  }

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <>
      <div className="space-y-4">
        {items.map((item, index) => {
          const isCurrentlyNow = isNow(item.start_time, item.end_time);
          const isUpNext = isNext(
            item.start_time,
            items.map((i) => ({ start_time: i.start_time, end_time: i.end_time }))
          );
          const hasDetails = item.description || item.speaker || item.location;

          return (
            <button
              key={item.id}
              onClick={() => hasDetails && setSelectedItem(item)}
              className={`w-full text-left glass rounded-[24px] p-6 transition-all duration-300 animate-slide-up relative overflow-hidden group ${
                isCurrentlyNow
                  ? "border-white/20 bg-white/[0.06]"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
              } ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isCurrentlyNow && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`text-[11px] font-medium uppercase tracking-[0.2em] ${
                      isCurrentlyNow
                        ? "text-white"
                        : isUpNext
                          ? "text-gray-400"
                          : "text-gray-600"
                    }`}>
                      {isCurrentlyNow ? "Now" : isUpNext ? "Next" : formatTime(item.start_time || "")}
                    </div>
                    {item.start_time && item.end_time && !isCurrentlyNow && (
                      <div className="text-[10px] text-gray-700 font-medium">
                        {formatDuration(item.start_time, item.end_time)}
                      </div>
                    )}
                    {item.start_time && item.end_time && (
                      <AgendaItemTimer startTime={item.start_time} endTime={item.end_time} />
                    )}
                  </div>

                  <h3 className="text-xl font-light text-white tracking-tight">
                    {item.title}
                  </h3>

                  {item.speaker && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.15em]">
                        {item.speaker}
                      </span>
                    </div>
                  )}
                </div>

                {hasDetails && (
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedItem(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          <div
            className="relative w-full sm:max-w-md mx-auto bg-[#0a0a0a] border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-8 animate-slide-up max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <div className="space-y-6">
              {/* Time badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em]">
                    {formatTime(selectedItem.start_time || "")}
                    {selectedItem.end_time && ` – ${formatTime(selectedItem.end_time)}`}
                  </span>
                </div>
                {formatDuration(selectedItem.start_time, selectedItem.end_time) && (
                  <span className="text-[10px] text-gray-600">
                    {formatDuration(selectedItem.start_time, selectedItem.end_time)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-light text-white tracking-tight pr-8">
                {selectedItem.title}
              </h2>

              {/* Description / Details */}
              {selectedItem.description && (() => {
                const parsed = parseDescription(selectedItem.description);
                return (
                  <div className="space-y-4">
                    {parsed.summary && (
                      <p className="text-sm text-gray-400 font-light leading-relaxed">
                        {parsed.summary}
                      </p>
                    )}
                    {parsed.details && (
                      <p className="text-sm text-gray-500 font-light leading-relaxed">
                        {parsed.details}
                      </p>
                    )}
                    {parsed.tips && parsed.tips.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
                          Tips
                        </p>
                        <ul className="space-y-1.5">
                          {parsed.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                              <span className="text-gray-700 mt-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Location */}
              {selectedItem.location && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
                      Location
                    </p>
                    <p className="text-sm text-gray-400">
                      {selectedItem.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Speaker */}
              {selectedItem.speaker && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
                      Host
                    </p>
                    <p className="text-sm text-gray-400">
                      {selectedItem.speaker}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
