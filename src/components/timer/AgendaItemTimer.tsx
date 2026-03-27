"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn, getTimerState } from "@/lib/utils";

interface AgendaItemTimerProps {
  startTime: string | null;
  endTime: string | null;
  eventStartTime?: string | null;
}

export function AgendaItemTimer({ startTime, endTime, eventStartTime }: AgendaItemTimerProps) {
  const [timerState, setTimerState] = useState<ReturnType<typeof getTimerState>>(null);

  useEffect(() => {
    if (!startTime || !endTime) {
      setTimerState(null);
      return;
    }

    const updateTimer = () => {
      const state = getTimerState(startTime, endTime, eventStartTime || null);
      setTimerState(state);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime, eventStartTime]);

  if (timerState === null) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-medium uppercase tracking-widest",
        timerState.state === "live"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : timerState.state === "starts-in"
            ? "bg-white/5 text-gray-500 border border-white/10"
            : timerState.state === "scheduled"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "bg-white/2 text-gray-700 border border-white/5"
      )}
    >
      <Clock className="w-3 h-3" />
      <span className="tabular-nums">{timerState.text}</span>
    </div>
  );
}

