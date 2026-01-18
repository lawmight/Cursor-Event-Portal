"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import { toggleSeatLockout } from "@/lib/actions/seating";
import toast from "react-hot-toast";
import type { Event } from "@/types";

interface SeatLockoutControlProps {
  event: Event;
  eventSlug: string;
}

export function SeatLockoutControl({ event, eventSlug }: SeatLockoutControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(event.seat_lockout_active);

  const handleToggle = () => {
    const newState = !isActive;
    
    // Confirm before activating
    if (newState) {
      const confirmed = confirm(
        "ACTIVATE SEAT LOCKOUT?\n\n" +
        "This will immediately block ALL attendees in approved groups from using their dashboard. " +
        "They will see a full-screen message directing them to their assigned table.\n\n" +
        "Only proceed when you're ready to begin the networking session."
      );
      if (!confirmed) return;
    }

    startTransition(async () => {
      const result = await toggleSeatLockout(event.id, newState, eventSlug);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsActive(newState);
        toast.success(newState ? "Seat lockout activated" : "Seat lockout deactivated");
        router.refresh();
      }
    });
  };

  return (
    <div className={`glass rounded-[40px] p-8 border-2 transition-all ${
      isActive 
        ? "border-red-500/50 bg-red-500/10" 
        : "border-white/20 hover:bg-white/10"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
            isActive 
              ? "bg-red-500/20 border-red-500/30" 
              : "bg-white/10 border-white/[0.05]"
          }`}>
            {isActive ? (
              <Lock className="w-6 h-6 text-red-400" />
            ) : (
              <Unlock className="w-6 h-6 text-gray-600" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-light tracking-tight text-white/90">
              Seat Assignment Lockout
            </h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
              {isActive ? "ACTIVE - Attendees locked to seating screen" : "Inactive - Attendees have full access"}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`px-8 py-3 rounded-full font-bold text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 ${
            isActive
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          }`}
        >
          {isPending ? "..." : isActive ? "Deactivate" : "Activate Lockout"}
        </button>
      </div>

      {isActive && (
        <div className="mt-6 flex items-start gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm text-red-300 font-medium">
              Lockout is currently active
            </p>
            <p className="text-xs text-red-400/80">
              All attendees in approved groups are seeing their table assignment and cannot access their dashboard. 
              Click "Deactivate" when the networking session begins to restore dashboard access.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
