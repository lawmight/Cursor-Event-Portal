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
}

export function SimulateStartButton({ event, eventSlug }: SimulateStartButtonProps) {
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
      const result = await simulateEventStart(event.id, eventSlug);
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
      className="glass rounded-[40px] p-6 border border-white/20 hover:bg-white/10 transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
            <Play className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-light tracking-tight text-white/90">
              Simulate Start
            </h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
              {isPending ? "Processing..." : "Test Event Start"}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
