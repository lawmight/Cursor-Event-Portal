"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkIn, undoCheckIn } from "@/lib/actions/registration";
import type { Event, Registration } from "@/types";
import { Search, UserCheck, UserX, Users, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CheckInClientProps {
  event: Event;
  initialRegistrations: Registration[];
  stats: { registered: number; checkedIn: number };
}

// Helper to get human-readable labels for signals
const SIGNAL_LABELS: Record<string, string> = {
  "learn-ai": "Learn AI/ML",
  "learn-coding": "Coding",
  "networking": "Networking",
  "find-cofounders": "Co-founders",
  "hire-talent": "Hire",
  "find-job": "Job Search",
  "explore-tools": "Tools",
  "ai-expertise": "AI/ML",
  "software-dev": "Dev",
  "design": "Design",
  "business-strategy": "Strategy",
  "funding-investment": "Funding",
  "mentorship": "Mentor",
  "collaboration": "Collab",
};

export function CheckInClient({
  event,
  initialRegistrations,
  stats,
}: CheckInClientProps) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredRegistrations = registrations.filter((reg) => {
    const query = searchQuery.toLowerCase();
    return (
      reg.user?.name.toLowerCase().includes(query) ||
      reg.user?.email?.toLowerCase().includes(query)
    );
  });

  const checkedInCount = registrations.filter((r) => r.checked_in_at).length;

  const handleCheckIn = async (registrationId: string) => {
    setActiveId(registrationId);
    setError(null);
    startTransition(async () => {
      try {
        const result = await checkIn(registrationId);
        if (result.success) {
          setRegistrations((prev) =>
            prev.map((r) =>
              r.id === registrationId
                ? { ...r, checked_in_at: new Date().toISOString() }
                : r
            )
          );
        } else {
          setError(result.error || "Failed to check in");
          console.error("Check-in failed:", result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Check-in exception:", err);
      } finally {
        setActiveId(null);
      }
    });
  };

  const handleUndoCheckIn = async (registrationId: string) => {
    console.log("handleUndoCheckIn called for registration:", registrationId);
    setActiveId(registrationId);
    setError(null);
    startTransition(async () => {
      try {
        console.log("Calling undoCheckIn function...");
        const result = await undoCheckIn(registrationId, event.slug);
        console.log("undoCheckIn result:", result);
        if (result.success) {
          setRegistrations((prev) =>
            prev.map((r) =>
              r.id === registrationId ? { ...r, checked_in_at: null } : r
            )
          );
          console.log("Successfully updated local state");
        } else {
          setError(result.error || "Failed to undo check-in");
          console.error("Undo check-in failed:", result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Undo check-in exception:", err);
      } finally {
        setActiveId(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-black-gradient text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5 backdrop-blur-3xl">
        <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href={`/admin/${event.slug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Exit</span>
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-[0.4em]">
            Check-In
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-12 animate-fade-in">
        {/* Stats - Floating Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass rounded-[32px] p-8 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">Registered</p>
            <p className="text-4xl font-light tracking-tighter">{registrations.length}</p>
          </div>

          <div className="glass rounded-[32px] p-8 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">Checked In</p>
            <p className="text-4xl font-light tracking-tighter text-white">{checkedInCount}</p>
          </div>
        </div>

        {/* Capacity - Ultra Minimal */}
        <div className="glass rounded-[32px] p-8 space-y-6">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.4em] text-gray-700 px-1">
            <span>Venue Capacity</span>
            <span>{checkedInCount} / {event.capacity}</span>
          </div>
          <div className="h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min((checkedInCount / event.capacity) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass rounded-[32px] p-6 bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Search - Focusable Border */}
        <div className="relative group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-800 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search attendees"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-white/10 rounded-none pl-10 pr-4 h-16 text-white placeholder:text-gray-800 focus:outline-none focus:border-white/30 transition-all text-2xl font-light"
          />
        </div>

        {/* Attendee List */}
        <div className="space-y-4">
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-24 glass rounded-[40px] border-dashed border-white/5 opacity-40">
              <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
                {searchQuery ? "No results found" : "Waiting for entries"}
              </p>
            </div>
          ) : (
            filteredRegistrations.map((registration, index) => {
              const isCheckedIn = !!registration.checked_in_at;
              const isActive = activeId === registration.id;

              return (
                <div
                  key={registration.id}
                  className={cn(
                    "glass rounded-[32px] p-6 transition-all duration-500 animate-slide-up flex items-center justify-between gap-6 group relative overflow-hidden",
                    isCheckedIn ? "bg-white/[0.04] border-white/20" : "bg-white/[0.01] border-white/5"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Intake Signals Hover Overlay */}
                  {registration.user?.intakes?.[0] && !registration.user.intakes[0].skipped && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center px-8 z-10 pointer-events-none">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mr-2 w-full mb-1">Attendee Signals</span>
                        {registration.user.intakes[0].goals?.filter(g => g !== 'other').map((goal) => (
                          <Badge key={goal} variant="outline" className="bg-white/5 border-white/10 text-white text-[9px] uppercase tracking-widest py-1 px-3 rounded-full">
                            {SIGNAL_LABELS[goal] || goal}
                          </Badge>
                        ))}
                        {registration.user.intakes[0].offers?.filter(o => o !== 'other').map((offer) => (
                          <Badge key={offer} variant="outline" className="bg-white/20 border-white/30 text-white text-[9px] uppercase tracking-widest py-1 px-3 rounded-full font-bold">
                            {SIGNAL_LABELS[offer] || offer}
                          </Badge>
                        ))}
                        {(registration.user.intakes[0].goals_other || registration.user.intakes[0].offers_other) && (
                          <Badge variant="outline" className="bg-white/5 border-white/10 text-white text-[9px] uppercase tracking-widest py-1 px-3 rounded-full italic">
                            Other Interests
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-5 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-light transition-all border",
                          isCheckedIn
                            ? "bg-white border-white text-black"
                            : "bg-white/[0.02] border-white/5 text-gray-600"
                        )}
                      >
                        {registration.user?.name.charAt(0).toUpperCase()}
                      </div>
                      {registration.user?.role === "admin" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">A</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-light text-white truncate tracking-tight">
                        {registration.user?.name}
                      </p>
                      <p className="text-[10px] text-gray-700 uppercase tracking-widest truncate font-medium mt-0.5">
                        {registration.user?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isCheckedIn ? (
                      <button
                        onClick={() => {
                          console.log("Undo button clicked for:", registration.id);
                          handleUndoCheckIn(registration.id);
                        }}
                        disabled={isPending && activeId === registration.id}
                        className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 text-gray-700 hover:text-red-500 hover:border-red-500/20 transition-all flex items-center justify-center group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserX className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(registration.id)}
                        disabled={isPending}
                        className="h-12 px-6 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all shadow-xl"
                      >
                        {isActive ? "..." : "Check In"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
