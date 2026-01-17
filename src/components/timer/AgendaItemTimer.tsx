"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgendaItemTimerProps {
  startTime: string | null;
  endTime: string | null;
}

export function AgendaItemTimer({ startTime, endTime }: AgendaItemTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [status, setStatus] = useState<"upcoming" | "active" | "ended">("upcoming");

  useEffect(() => {
    if (!startTime || !endTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now < start) {
        // Upcoming
        const remaining = Math.floor((start - now) / 1000 / 60);
        setTimeRemaining(remaining);
        setStatus("upcoming");
      } else if (now >= start && now < end) {
        // Active
        const remaining = Math.floor((end - now) / 1000 / 60);
        setTimeRemaining(remaining);
        setStatus("active");
      } else {
        // Ended
        setTimeRemaining(0);
        setStatus("ended");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  if (timeRemaining === null) return null;

  const hours = Math.floor(Math.abs(timeRemaining) / 60);
  const minutes = Math.abs(timeRemaining) % 60;

  const formatTime = (h: number, m: number) => {
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-medium uppercase tracking-[0.1em]",
        status === "active"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : status === "upcoming"
            ? "bg-white/5 text-gray-500 border border-white/10"
            : "bg-white/[0.02] text-gray-700 border border-white/5"
      )}
    >
      <Clock className="w-3 h-3" />
      <span className="tabular-nums">
        {status === "upcoming" && "-"}
        {formatTime(hours, minutes)}
        {status === "active" && " left"}
        {status === "ended" && " ago"}
      </span>
    </div>
  );
}
