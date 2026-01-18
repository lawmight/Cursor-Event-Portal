"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  UserPlus,
  Check,
  Loader2,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Clock,
  Phone,
} from "lucide-react";
import { submitIntake, skipIntake } from "@/lib/actions/intake";
import type { IntakeGoalTag, IntakeOfferTag } from "@/types";

interface Attendee {
  id: string;
  name: string;
  email: string | null;
}

interface AttendeeCheckinFormProps {
  eventId: string;
  eventSlug: string;
}

type Step =
  | "email"
  | "confirm"
  | "guest"
  | "submitting"
  | "success"
  | "intake-goals"
  | "intake-offers"
  | "complete";

const GOAL_OPTIONS: { value: IntakeGoalTag; label: string }[] = [
  { value: "learn-ai", label: "Learn about AI/ML" },
  { value: "learn-coding", label: "Improve coding skills" },
  { value: "networking", label: "Meet new people" },
  { value: "find-cofounders", label: "Find co-founders" },
  { value: "hire-talent", label: "Hire talent" },
  { value: "find-job", label: "Find job opportunities" },
  { value: "explore-tools", label: "Explore new tools" },
  { value: "other", label: "Other" },
];

const OFFER_OPTIONS: { value: IntakeOfferTag; label: string }[] = [
  { value: "ai-expertise", label: "AI/ML expertise" },
  { value: "software-dev", label: "Software development" },
  { value: "design", label: "Design skills" },
  { value: "business-strategy", label: "Business strategy" },
  { value: "funding-investment", label: "Funding/Investment" },
  { value: "mentorship", label: "Mentorship" },
  { value: "collaboration", label: "Open to collaborate" },
  { value: "other", label: "Other" },
];

export function AttendeeCheckinForm({
  eventId,
  eventSlug,
}: AttendeeCheckinFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [foundAttendee, setFoundAttendee] = useState<Attendee | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [bringingGuest, setBringingGuest] = useState<boolean | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState("");
  const [isLooking, setIsLooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Intake form state
  const [goals, setGoals] = useState<IntakeGoalTag[]>([]);
  const [goalsOther, setGoalsOther] = useState("");
  const [offers, setOffers] = useState<IntakeOfferTag[]>([]);
  const [offersOther, setOffersOther] = useState("");
  const [intakeLoading, setIntakeLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (hasCheckedSession) return;
      setHasCheckedSession(true);

      setIsLooking(true);
      try {
        // Try to lookup registration using session (no email provided)
        const response = await fetch("/api/lookup-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });

        const data = await response.json();

        if (data.found) {
          setFoundAttendee(data.attendee);
          setAlreadyCheckedIn(data.alreadyCheckedIn || false);
          setStep("confirm");
          // Pre-fill email if available
          if (data.attendee.email) {
            setEmail(data.attendee.email);
          }
        }
        // If not found, silently continue - user can enter email manually
      } catch (err) {
        // Silently fail - user can enter email manually
      } finally {
        setIsLooking(false);
      }
    };

    checkSession();
  }, [eventId, hasCheckedSession]);

  const handleEmailLookup = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLooking(true);
    setError("");

    try {
      const response = await fetch("/api/lookup-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, email: email.trim() }),
      });

      const data = await response.json();

      if (!data.found) {
        setError(
          "No registration found for this email. This event is registration-only."
        );
        setIsLooking(false);
        return;
      }

      setFoundAttendee(data.attendee);
      setAlreadyCheckedIn(data.alreadyCheckedIn || false);
      setStep("confirm");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLooking(false);
    }
  };

  const handleConfirm = async () => {
    if (alreadyCheckedIn) {
      // Already checked in - go to success screen with intake option
      setStep("success");
      return;
    }
    setStep("guest");
  };

  const handleSubmit = async () => {
    if (!foundAttendee) return;

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
          attendeeId: foundAttendee.id,
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

      // Go to success step (with intake option)
      setStep("success");
      setIsSubmitting(false);
    } catch (err) {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step === "email" && !isLooking) {
      handleEmailLookup();
    }
  };

  const toggleGoal = (goal: IntakeGoalTag) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleOffer = (offer: IntakeOfferTag) => {
    setOffers((prev) =>
      prev.includes(offer) ? prev.filter((o) => o !== offer) : [...prev, offer]
    );
  };

  const handleSkipIntake = async () => {
    setIntakeLoading(true);
    const result = await skipIntake(eventId, eventSlug);
    if (result.error) {
      setError(result.error);
      setIntakeLoading(false);
    } else {
      setStep("complete");
      setIntakeLoading(false);
    }
  };

  const handleIntakeSubmit = async () => {
    if (step === "intake-goals") {
      setStep("intake-offers");
      return;
    }

    setIntakeLoading(true);
    setError("");

    const result = await submitIntake(eventId, eventSlug, {
      goals,
      goalsOther: goals.includes("other") ? goalsOther : undefined,
      offers,
      offersOther: offers.includes("other") ? offersOther : undefined,
    });

    if (result.error) {
      setError(result.error);
      setIntakeLoading(false);
    } else {
      setStep("complete");
      setIntakeLoading(false);
    }
  };

  const handleGoToAgenda = () => {
    router.push(`/${eventSlug}/agenda`);
    router.refresh();
  };

  // Step 1: Email input
  if (step === "email") {
    return (
      <div className="glass rounded-[40px] p-10 border-white/20 shadow-2xl relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold">
              Registration Only Event
            </p>
            <p className="text-gray-500 text-sm font-light">
              Enter your registered email to check in
            </p>
          </div>

          <div className="relative group">
            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-white transition-colors" />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-transparent border-b border-white/10 rounded-none pl-10 pr-4 h-14 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-xl font-light"
              autoFocus
              autoComplete="email"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/80 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-light">{error}</p>
            </div>
          )}

          <button
            onClick={handleEmailLookup}
            disabled={isLooking || !email.trim()}
            className="w-full h-16 rounded-[32px] bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {isLooking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="text-sm font-bold uppercase tracking-[0.2em]">
                Find My Registration
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Confirm identity
  if (step === "confirm" && foundAttendee) {
    return (
      <div className="glass rounded-[40px] p-10 border-white/20 shadow-2xl relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="space-y-8 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold">
                Registration Found
              </p>
              <p className="text-2xl font-light text-white leading-tight">
                {foundAttendee.name}
              </p>
              {alreadyCheckedIn && (
                <p className="text-green-400/80 text-sm font-light">
                  Already checked in
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleConfirm}
              className="w-full h-16 rounded-[32px] bg-white text-black hover:bg-gray-200 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <span className="text-sm font-bold uppercase tracking-[0.2em]">
                {alreadyCheckedIn ? "Continue" : "Yes, That's Me"}
              </span>
            </button>

            <button
              onClick={() => {
                setStep("email");
                setFoundAttendee(null);
                setError("");
              }}
              className="w-full h-12 rounded-[24px] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="text-xs font-medium uppercase tracking-[0.15em]">
                Try Different Email
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Guest question
  if (step === "guest") {
    return (
      <div className="glass rounded-[40px] p-10 border-white/20 shadow-2xl relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="space-y-10 animate-fade-in">
          {/* Selected attendee - Ultra minimal */}
          <div className="flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold">
                Checking in as
              </p>
              <p className="text-2xl font-light text-white leading-tight">
                {foundAttendee?.name}
              </p>
            </div>
            <button
              onClick={() => {
                setFoundAttendee(null);
                setStep("email");
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
                    <span className="text-xl font-light text-white/40 group-hover:text-white transition-colors">
                      No
                    </span>
                    <span className="text-[8px] uppercase tracking-[0.3em] text-gray-700 group-hover:text-gray-500">
                      Just Me
                    </span>
                  </div>
                </button>
                <button
                  className="group relative aspect-square rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all overflow-hidden"
                  onClick={() => setBringingGuest(true)}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                    <span className="text-[8px] uppercase tracking-[0.3em] text-gray-700 group-hover:text-gray-500">
                      Plus One
                    </span>
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
                  <span className="text-sm font-bold uppercase tracking-[0.2em]">
                    Check In
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 4: Success - Checked in! Offer intake
  if (step === "success") {
    return (
      <div className="glass rounded-[40px] p-10 border-white/20 shadow-2xl relative animate-fade-in">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="space-y-10">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center animate-bounce-subtle">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-light text-white tracking-tight">
                You're In!
              </h2>
              <p className="text-gray-500 text-sm font-light max-w-xs mx-auto">
                Welcome to Cursor Calgary, {foundAttendee?.name?.split(" ")[0]}!
              </p>
            </div>
          </div>

          {/* Intake Invitation */}
          <div className="glass rounded-3xl p-6 bg-white/[0.02] border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <h3 className="text-lg font-light text-white tracking-tight">
                  Help Us Optimize Your Seating
                </h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-0.5">
                  Optional · 10 seconds
                </p>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Share what you're looking for and what you can offer. Our AI will
              use this to create meaningful table arrangements at 6:30 PM.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setStep("intake-goals")}
              className="w-full h-16 rounded-[32px] bg-white text-black hover:bg-gray-200 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <span className="text-sm font-bold uppercase tracking-[0.2em]">
                Share My Signals
              </span>
            </button>

            <button
              onClick={handleSkipIntake}
              disabled={intakeLoading}
              className="w-full h-12 rounded-[24px] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              {intakeLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-xs font-medium uppercase tracking-[0.15em]">
                  Skip for Now
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 5 & 6: Intake form (goals and offers)
  if (step === "intake-goals" || step === "intake-offers") {
    const isGoals = step === "intake-goals";
    const options = isGoals ? GOAL_OPTIONS : OFFER_OPTIONS;
    const selected = isGoals ? goals : offers;
    const otherText = isGoals ? goalsOther : offersOther;

    return (
      <div className="glass rounded-[40px] p-10 border-white/20 shadow-2xl relative animate-fade-in">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">
              {isGoals ? "Step 01" : "Step 02"}
            </p>
            <button
              onClick={handleSkipIntake}
              disabled={intakeLoading}
              className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.3em] hover:text-white transition-colors"
            >
              Skip
            </button>
          </div>

          <h3 className="text-2xl font-light text-white tracking-tight leading-tight">
            {isGoals ? "What are you looking for?" : "What can you share?"}
          </h3>

          {/* Tag selection grid */}
          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => {
              const isSelected = isGoals
                ? goals.includes(option.value as IntakeGoalTag)
                : offers.includes(option.value as IntakeOfferTag);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    isGoals
                      ? toggleGoal(option.value as IntakeGoalTag)
                      : toggleOffer(option.value as IntakeOfferTag)
                  }
                  disabled={intakeLoading}
                  className={`p-4 rounded-2xl border text-[10px] font-medium uppercase tracking-[0.1em] text-center transition-all duration-300 flex items-center justify-center leading-relaxed ${
                    isSelected
                      ? "border-white/20 bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.02]"
                      : "border-white/[0.03] bg-white/[0.01] text-gray-600 hover:border-white/10 hover:text-gray-400"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Other text input */}
          {selected.includes("other") && (
            <div className="animate-fade-in">
              <textarea
                placeholder="Tell us more..."
                value={otherText}
                onChange={(e) =>
                  isGoals
                    ? setGoalsOther(e.target.value)
                    : setOffersOther(e.target.value)
                }
                rows={2}
                disabled={intakeLoading}
                className="w-full bg-transparent border-b border-white/10 rounded-none py-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-lg font-light resize-none leading-relaxed"
              />
            </div>
          )}

          {error && (
            <div className="text-center p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/80 text-[10px] font-medium uppercase tracking-widest animate-fade-in">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {!isGoals && (
              <button
                onClick={() => setStep("intake-goals")}
                disabled={intakeLoading}
                className="aspect-square w-16 flex items-center justify-center rounded-full bg-white/[0.02] border border-white/5 text-gray-600 hover:text-white hover:border-white/20 transition-all"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <button
              className="flex-1 h-16 rounded-[32px] bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]"
              onClick={handleIntakeSubmit}
              disabled={intakeLoading}
            >
              {intakeLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : isGoals ? (
                "Continue"
              ) : (
                "Complete"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 7: Complete - All done! Watch your phone
  if (step === "complete") {
    return (
      <div className="glass rounded-[40px] p-10 border-white/20 shadow-2xl relative animate-fade-in">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="space-y-10">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-light text-white tracking-tight">
                You're All Set!
              </h2>
              <p className="text-gray-500 text-sm font-light max-w-xs mx-auto">
                Enjoy the event, {foundAttendee?.name?.split(" ")[0]}!
              </p>
            </div>
          </div>

          {/* Seat Assignment Notice */}
          <div className="glass rounded-3xl p-6 bg-white/[0.02] border-white/5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-white/60" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-light text-white tracking-tight">
                  Keep an Eye on Your Phone
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                    Seating assigned at 6:30 PM
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              At 6:30, you'll receive your table and seat number—optimized by AI
              based on everyone's goals and expertise. Get ready for great
              conversations!
            </p>
          </div>

          <button
            onClick={handleGoToAgenda}
            className="w-full h-16 rounded-[32px] bg-white text-black hover:bg-gray-200 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <span className="text-sm font-bold uppercase tracking-[0.2em]">
              View Event Agenda
            </span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
