"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { simulateEventStart } from "@/lib/actions/seating";
import toast from "react-hot-toast";
import type { Event } from "@/types";

interface SimulateStartButtonProps {
  event: Event;
  eventSlug: string;
  adminCode?: string;
}

export function SimulateStartButton({ event, eventSlug, adminCode }: SimulateStartButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSimulateStart = () => {
    const confirmed = confirm(
      "SIMULATE EVENT START?\n\n" +
      "This will deactivate the seat lockout, allowing all attendees to access their full dashboard.\n\n" +
      "This is for testing purposes. In production, this happens automatically at the event start time."
    );
    
    if (!confirmed) return;

    startTransition(async () => {
      const result = await simulateEventStart(event.id, eventSlug, adminCode);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Event start simulated! Lockout deactivated.");
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleSimulateStart}
      disabled={isPending || !event.seat_lockout_active}
      className="w-full glass rounded-[40px] p-8 border border-white/20 hover:bg-white/10 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed animate-beam relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Play className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors fill-current opacity-50 group-hover:opacity-100" />
          </div>
          <div className="text-left space-y-1">
            <h3 className="text-2xl font-light tracking-tight text-white/90">
              Simulate Start
            </h3>
            <p className="text-[11px] uppercase tracking-[0.4em] text-gray-500 font-medium">
              {isPending ? "Processing Engine..." : "Force Deactivate Lockout"}
            </p>
          </div>
        </div>
        <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold group-hover:bg-white group-hover:text-black transition-all">
          Trigger
        </div>
      </div>
    </button>
  );
}

