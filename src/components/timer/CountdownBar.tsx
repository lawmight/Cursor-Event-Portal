"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";

interface CountdownBarProps {
  event: Event;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CountdownBar({ event }: CountdownBarProps) {
  const [timerLabel, setTimerLabel] = useState<string | null>(event.timer_label);
  const [timerEndTime, setTimerEndTime] = useState<string | null>(event.timer_end_time);
  const [timerActive, setTimerActive] = useState<boolean>(event.timer_active);
  const [remainingMs, setRemainingMs] = useState(0);
  const [showExpired, setShowExpired] = useState(false);
  const [hideAfterExpired, setHideAfterExpired] = useState(false);
  const totalMsRef = useRef<number | null>(null);
  const expireTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setTimerLabel(event.timer_label);
    setTimerEndTime(event.timer_end_time);
    setTimerActive(event.timer_active);
  }, [event.timer_label, event.timer_end_time, event.timer_active]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-timer-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${event.id}`,
        },
        (payload) => {
          const updated = payload.new as Event;
          setTimerLabel(updated.timer_label);
          setTimerEndTime(updated.timer_end_time);
          setTimerActive(updated.timer_active);

          if (updated.timer_active && updated.timer_end_time) {
            totalMsRef.current = new Date(updated.timer_end_time).getTime() - Date.now();
            setHideAfterExpired(false);
            setShowExpired(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id]);

  useEffect(() => {
    if (expireTimeoutRef.current) {
      window.clearTimeout(expireTimeoutRef.current);
      expireTimeoutRef.current = null;
    }

    if (!timerActive || !timerEndTime) {
      setRemainingMs(0);
      setShowExpired(false);
      setHideAfterExpired(false);
      totalMsRef.current = null;
      return;
    }

    const endMs = new Date(timerEndTime).getTime();
    if (!totalMsRef.current || totalMsRef.current <= 0) {
      totalMsRef.current = Math.max(0, endMs - Date.now());
    }

    const tick = () => {
      const diff = endMs - Date.now();
      if (diff <= 0) {
        setRemainingMs(0);
        if (!showExpired && !hideAfterExpired) {
          setShowExpired(true);
          expireTimeoutRef.current = window.setTimeout(() => {
            setHideAfterExpired(true);
          }, 5000);
        }
        return;
      }

      setRemainingMs(diff);
      setShowExpired(false);
      setHideAfterExpired(false);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [timerActive, timerEndTime, showExpired, hideAfterExpired]);

  if (!timerActive || !timerEndTime || hideAfterExpired) {
    return null;
  }

  const totalMs = totalMsRef.current || remainingMs || 1;
  const progress = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  return (
    <div className="sticky top-0 z-40">
      <div className="glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-2 h-2 rounded-full",
                showExpired ? "bg-red-500 animate-pulse" : "bg-white/40"
              )} />
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-medium">
                {showExpired ? "Time's Up" : (timerLabel || "Countdown")}
              </p>
            </div>
            <div className="text-white text-lg font-light tracking-tight tabular-nums">
              {showExpired ? "TIME'S UP!" : formatRemaining(remainingMs)}
            </div>
          </div>
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000",
                showExpired ? "bg-red-500" : "bg-white"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
