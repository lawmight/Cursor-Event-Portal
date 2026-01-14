"use client";

import Link from "next/link";
import type { Event, Announcement } from "@/types";
import { cn } from "@/lib/utils";

interface EventHeaderProps {
  event: Event;
  announcement?: Announcement | null;
}

export function EventHeader({ event, announcement }: EventHeaderProps) {
  return (
    <header className="sticky top-0 z-40">
      {/* Announcement Banner */}
      {announcement && (
        <div className="bg-gradient-to-r from-cursor-purple to-cursor-purple-dark text-white px-4 py-2.5 text-sm text-center font-medium animate-fade-in">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
            {announcement.content}
          </span>
        </div>
      )}

      {/* Main Header */}
      <div className="glass border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${event.slug}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cursor-purple to-cursor-purple-dark text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-cursor-purple/20 group-hover:shadow-xl group-hover:shadow-cursor-purple/30 transition-all duration-200">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                {event.name}
              </span>
              {event.venue && (
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
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
