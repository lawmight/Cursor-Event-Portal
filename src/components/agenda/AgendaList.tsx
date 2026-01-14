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
    <div className="space-y-3">
      {items.map((item) => {
        const isCurrentlyNow = isNow(item.start_time, item.end_time);
        const isUpNext = isNext(
          item.start_time,
          items.map((i) => ({ start_time: i.start_time, end_time: i.end_time }))
        );

        return (
          <Card
            key={item.id}
            className={`p-4 transition-all ${
              isCurrentlyNow
                ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20"
                : isUpNext
                ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Status Badge */}
                {(isCurrentlyNow || isUpNext) && (
                  <div className="mb-2">
                    {isCurrentlyNow ? (
                      <Badge variant="now">Now</Badge>
                    ) : (
                      <Badge variant="next">Up Next</Badge>
                    )}
                  </div>
                )}

                {/* Title */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {item.description}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {item.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(item.start_time)}
                      {item.end_time && ` – ${formatTime(item.end_time)}`}
                    </span>
                  )}
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {item.location}
                    </span>
                  )}
                  {item.speaker && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {item.speaker}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
