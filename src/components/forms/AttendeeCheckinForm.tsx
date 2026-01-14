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

      // Redirect to agenda
      router.push(`/${eventSlug}/agenda`);
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Step 1: Search and select attendee
  if (step === "search" || !selectedAttendee) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search your name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
            autoFocus
          />
        </div>

        {searchQuery.trim() && (
          <div className="space-y-2">
            {filteredAttendees.length > 0 ? (
              filteredAttendees.map((attendee) => (
                <button
                  key={attendee.id}
                  onClick={() => handleSelectAttendee(attendee)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-cursor-purple hover:bg-cursor-purple/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-cursor-purple/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-cursor-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {attendee.name}
                    </p>
                    {attendee.email && (
                      <p className="text-sm text-gray-500 truncate">
                        {attendee.email}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cursor-purple transition-colors" />
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No matching attendees found.</p>
                <p className="text-sm mt-1">
                  Make sure you registered on Luma.
                </p>
              </div>
            )}
          </div>
        )}

        {!searchQuery.trim() && (
          <p className="text-center text-sm text-gray-500 py-4">
            Type your name to find your registration
          </p>
        )}
      </div>
    );
  }

  // Step 2: Guest question
  return (
    <div className="space-y-6">
      {/* Selected attendee */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-cursor-purple/5 border border-cursor-purple/20">
        <div className="w-12 h-12 rounded-full bg-cursor-purple/20 flex items-center justify-center">
          <User className="w-6 h-6 text-cursor-purple" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">
            {selectedAttendee.name}
          </p>
          <p className="text-sm text-gray-500">Ready to check in</p>
        </div>
        <button
          onClick={() => {
            setSelectedAttendee(null);
            setStep("search");
            setBringingGuest(null);
          }}
          className="text-sm text-cursor-purple hover:underline"
        >
          Change
        </button>
      </div>

      {/* Guest question */}
      {bringingGuest === null && (
        <div className="space-y-3">
          <p className="text-center font-medium text-gray-900 dark:text-white">
            Are you bringing anyone with you?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-16 flex-col gap-1"
              onClick={() => setBringingGuest(false)}
            >
              <span className="text-lg">No</span>
              <span className="text-xs text-gray-500">Just me</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1"
              onClick={() => setBringingGuest(true)}
            >
              <UserPlus className="w-5 h-5" />
              <span className="text-xs text-gray-500">Yes, +1 guest</span>
            </Button>
          </div>
        </div>
      )}

      {/* Guest form */}
      {bringingGuest === true && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-cursor-purple" />
              <span className="font-medium">Guest Information</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Guest Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Guest's full name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Guest Email <span className="text-gray-400">(optional)</span>
              </label>
              <Input
                type="email"
                placeholder="guest@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit button */}
      {bringingGuest !== null && (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Checking in...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Check In
            </>
          )}
        </Button>
      )}

      {bringingGuest === true && (
        <button
          onClick={() => setBringingGuest(null)}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          ← Go back
        </button>
      )}
    </div>
  );
}
