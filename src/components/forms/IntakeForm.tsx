"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { submitIntake, skipIntake } from "@/lib/actions/intake";
import type { IntakeGoalTag, IntakeOfferTag } from "@/types";

interface IntakeFormProps {
  eventId: string;
  eventSlug: string;
}

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

export function IntakeForm({ eventId, eventSlug }: IntakeFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"goals" | "offers">("goals");
  const [goals, setGoals] = useState<IntakeGoalTag[]>([]);
  const [goalsOther, setGoalsOther] = useState("");
  const [offers, setOffers] = useState<IntakeOfferTag[]>([]);
  const [offersOther, setOffersOther] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSkip = async () => {
    setLoading(true);
    const result = await skipIntake(eventId, eventSlug);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${eventSlug}/agenda`);
    }
  };

  const handleSubmit = async () => {
    if (step === "goals") {
      setStep("offers");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await submitIntake(eventId, eventSlug, {
      goals,
      goalsOther: goals.includes("other") ? goalsOther : undefined,
      offers,
      offersOther: offers.includes("other") ? offersOther : undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${eventSlug}/agenda`);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {step === "goals" ? (
              <>
                <span className="text-xl">🎯</span>
                What are you looking for?
              </>
            ) : (
              <>
                <span className="text-xl">🤝</span>
                What can you offer?
              </>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleSkip} disabled={loading}>
            Skip
          </Button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {step === "goals"
            ? "Select your goals for today (we'll help connect you with others)"
            : "What skills or resources can you share?"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Privacy notice */}
        <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
          Your responses help us suggest networking connections.
          This is optional and you can skip at any time.
        </div>

        {/* Tag selection */}
        <div className="grid grid-cols-2 gap-2">
          {(step === "goals" ? GOAL_OPTIONS : OFFER_OPTIONS).map((option) => {
            const isSelected =
              step === "goals"
                ? goals.includes(option.value as IntakeGoalTag)
                : offers.includes(option.value as IntakeOfferTag);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  step === "goals"
                    ? toggleGoal(option.value as IntakeGoalTag)
                    : toggleOffer(option.value as IntakeOfferTag)
                }
                disabled={loading}
                className={`p-3 rounded-xl border text-sm text-left transition-all ${
                  isSelected
                    ? "border-cursor-purple bg-cursor-purple/10 text-cursor-purple font-medium"
                    : "border-gray-200 dark:border-gray-700 hover:border-cursor-purple/50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Other text input */}
        {(step === "goals" ? goals : offers).includes("other") && (
          <Textarea
            placeholder="Tell us more..."
            value={step === "goals" ? goalsOther : offersOther}
            onChange={(e) =>
              step === "goals"
                ? setGoalsOther(e.target.value)
                : setOffersOther(e.target.value)
            }
            rows={2}
            disabled={loading}
          />
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {step === "offers" && (
            <Button
              variant="outline"
              onClick={() => setStep("goals")}
              disabled={loading}
            >
              Back
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={handleSubmit}
            loading={loading}
          >
            {step === "goals" ? "Next →" : "Complete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
