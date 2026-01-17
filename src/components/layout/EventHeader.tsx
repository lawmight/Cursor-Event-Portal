"use client";

import Link from "next/link";
import Image from "next/image";
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
        </div>
      </div>
    </header>
  );
}
