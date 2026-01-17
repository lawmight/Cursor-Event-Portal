"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  User,
  UserPlus,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface Attendee {
  id: string;
  name: string;
  email: string | null;
}

interface AttendeeCheckinFormProps {
  eventId: string;
  eventSlug: string;
  attendees: Attendee[];
}

type Step = "search" | "guest" | "submitting";

export function AttendeeCheckinForm({
  eventId,
  eventSlug,
  attendees,
}: AttendeeCheckinFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [bringingGuest, setBringingGuest] = useState<boolean | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter attendees based on search query
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return attendees
      .filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email?.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [searchQuery, attendees]);

  const handleSelectAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setSearchQuery(attendee.name);
    setStep("guest");
  };

  const handleSubmit = async () => {
    if (!selectedAttendee) return;

    // Validate guest info if bringing someone
    if (bringingGuest && !guestName.trim()) {
      setError("Please enter your guest's name");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          attendeeId: selectedAttendee.id,
          guest: bringingGuest
            ? { name: guestName.trim(), email: guestEmail.trim() || null }
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Check-in failed");
        setIsSubmitting(false);
        return;
      }

      // Redirect to intake (then to agenda after completion)
      router.push(`/${eventSlug}/intake`);
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Step 1: Search and select attendee
  if (step === "search" || !selectedAttendee) {
    return (
      <div className="space-y-8">
        <div className="relative group">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search your name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-white/10 rounded-none pl-10 pr-4 h-14 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-xl font-light"
            autoFocus
          />
        </div>

        {searchQuery.trim() && (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
            {filteredAttendees.length > 0 ? (
              filteredAttendees.map((attendee) => (
                <button
                  key={attendee.id}
                  onClick={() => handleSelectAttendee(attendee)}
                  className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/10 hover:translate-x-1 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-white/90 group-hover:text-white transition-colors">
                      {attendee.name}
                    </p>
                    {attendee.email && (
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mt-1">
                        {attendee.email.split('@')[0]}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-sm font-light uppercase tracking-widest italic">No match found</p>
              </div>
            )}
          </div>
        )}

        {!searchQuery.trim() && (
          <div className="text-center py-10 opacity-40">
            <div className="w-1 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <p className="text-[9px] uppercase tracking-[0.4em] text-gray-600 font-medium">
              Start typing to check in
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Guest question
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Selected attendee - Ultra minimal */}
      <div className="flex items-center justify-between group">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold">Checking in as</p>
          <p className="text-2xl font-light text-white leading-tight">
            {selectedAttendee.name}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAttendee(null);
            setStep("search");
            setBringingGuest(null);
          }}
          className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-gray-600 hover:text-white hover:border-white/20 transition-all"
        >
          <ChevronRight className="w-4 h-4 rotate-180 -translate-x-0.5" />
        </button>
      </div>

      {/* Guest question - Minimal buttons */}
      {bringingGuest === null && (
        <div className="space-y-8 py-4">
          <p className="text-center text-xs font-light tracking-[0.2em] text-gray-500 uppercase">
            Bringing a guest?
          </p>
          <div className="grid grid-cols-2 gap-6">
            <button
              className="group relative aspect-square rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all overflow-hidden"
              onClick={() => setBringingGuest(false)}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 group-hover:scale-110 transition-transform">
                <span className="text-xl font-light text-white/40 group-hover:text-white transition-colors">No</span>
                <span className="text-[8px] uppercase tracking-[0.3em] text-gray-700 group-hover:text-gray-500">Just Me</span>
              </div>
            </button>
            <button
              className="group relative aspect-square rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all overflow-hidden"
              onClick={() => setBringingGuest(true)}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 group-hover:scale-110 transition-transform">
                <UserPlus className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                <span className="text-[8px] uppercase tracking-[0.3em] text-gray-700 group-hover:text-gray-500">Plus One</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Guest form - Simplified */}
      {bringingGuest === true && (
        <div className="space-y-6 animate-slide-up">
          <div className="space-y-6">
            <div className="relative">
               <input
                type="text"
                placeholder="Guest Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 rounded-none px-0 h-14 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-lg font-light"
                autoFocus
              />
            </div>
            <div className="relative">
               <input
                type="email"
                placeholder="Guest Email (Optional)"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 rounded-none px-0 h-14 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-lg font-light"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-center p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/80 text-[10px] font-medium uppercase tracking-widest animate-fade-in">
          {error}
        </div>
      )}

      {/* Submit button - Ultra sleek white/black */}
      {bringingGuest !== null && (
        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-16 rounded-[32px] bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="text-sm font-bold uppercase tracking-[0.2em]">Confirm</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
