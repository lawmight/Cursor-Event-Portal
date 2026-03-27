"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { startTimer, stopTimer } from "@/lib/actions/timer";
import { cn } from "@/lib/utils";

interface TimerAdminProps {
  event: Event;
  adminCode?: string;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerAdmin({ event, adminCode }: TimerAdminProps) {
  const [label, setLabel] = useState(event.timer_label || "");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [timerLabel, setTimerLabel] = useState<string | null>(event.timer_label);
  const [timerEndTime, setTimerEndTime] = useState<string | null>(event.timer_end_time);
  const [timerActive, setTimerActive] = useState<boolean>(event.timer_active);
  const [remaining, setRemaining] = useState("00:00:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`event-timer-admin-${event.id}`)
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id]);

  useEffect(() => {
    if (!timerActive || !timerEndTime) {
      setRemaining("00:00:00");
      return;
    }

    const endMs = new Date(timerEndTime).getTime();
    const tick = () => {
      const diff = endMs - Date.now();
      setRemaining(formatRemaining(diff));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [timerActive, timerEndTime]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await startTimer(event.id, label, durationMinutes, adminCode);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Timer started");
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await stopTimer(event.id, adminCode);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess("Timer stopped");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <div className="glass rounded-[40px] p-10 border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium">Shared Countdown</p>
            <h2 className="text-3xl font-light text-white tracking-tight">Timer Control</h2>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] font-medium",
            timerActive ? "bg-green-500/10 text-green-400" : "bg-white/5 text-gray-500"
          )}>
            {timerActive ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-medium">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Break ends in"
              className="w-full bg-white/3 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-white/30 transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-medium">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-white/3 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-white/30 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 h-14 rounded-full bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Start Timer
          </button>
          <button
            onClick={handleStop}
            disabled={loading || !timerActive}
            className="flex-1 h-14 rounded-full bg-white/5 border border-white/10 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Stop Timer
          </button>
        </div>

        {(error || success) && (
          <div className={cn(
            "text-center p-4 rounded-2xl text-[10px] font-medium uppercase tracking-widest",
            error ? "bg-red-500/5 text-red-400/80" : "bg-green-500/5 text-green-400/80"
          )}>
            {error || success}
          </div>
        )}
      </div>

      <div className="glass rounded-[36px] p-8 border border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-medium">Current State</p>
            <p className="text-2xl font-light text-white tracking-tight">
              {timerActive ? (timerLabel || "Countdown") : "No active timer"}
            </p>
          </div>
          <div className="text-2xl font-light text-white tabular-nums">
            {timerActive ? remaining : "--:--:--"}
          </div>
        </div>
      </div>
    </div>
  );
}
