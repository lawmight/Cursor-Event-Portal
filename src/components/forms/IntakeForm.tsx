"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight } from "lucide-react";
import { submitIntake, skipIntake } from "@/lib/actions/intake";
import { SurveyConsentModal } from "@/components/consent/SurveyConsentModal";
import type {
  IntakeGoalTag,
  IntakeOfferTag,
  AttendeeRoleCategory,
  FounderStage,
  DegreeType,
  CursorExperience,
} from "@/types";

interface IntakeFormProps {
  eventId: string;
  eventSlug: string;
  hasConsented?: boolean;
  userEmail?: string | null;
  retentionDays?: number;
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

const ROLE_OPTIONS: { value: AttendeeRoleCategory; label: string }[] = [
  { value: "founder", label: "Founder" },
  { value: "professional", label: "Professional" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

const FOUNDER_STAGE_OPTIONS: { value: FounderStage; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b-plus", label: "Series B+" },
  { value: "bootstrapped", label: "Bootstrapped" },
  { value: "other", label: "Other" },
];

const DEGREE_OPTIONS: { value: DegreeType; label: string }[] = [
  { value: "high-school", label: "High School" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "other", label: "Other" },
];

const CURSOR_EXPERIENCE_OPTIONS: { value: CursorExperience; label: string }[] = [
  { value: "none", label: "Never used" },
  { value: "curious", label: "Heard of it" },
  { value: "trialed", label: "Tried it" },
  { value: "active", label: "Use weekly" },
  { value: "power", label: "Daily user" },
];

export function IntakeForm({ eventId, eventSlug, hasConsented = false, userEmail = null, retentionDays = 60 }: IntakeFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"profile" | "goals" | "offers">("profile");
  const [roleCategory, setRoleCategory] = useState<AttendeeRoleCategory>("professional");
  const [founderStage, setFounderStage] = useState<FounderStage | "">("");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [degreeType, setDegreeType] = useState<DegreeType | "">("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [intent, setIntent] = useState("");
  const [followupConsent, setFollowupConsent] = useState<boolean | null>(null);
  const [cursorExperience, setCursorExperience] = useState<CursorExperience>("none");
  const [goals, setGoals] = useState<IntakeGoalTag[]>([]);
  const [goalsOther, setGoalsOther] = useState("");
  const [offers, setOffers] = useState<IntakeOfferTag[]>([]);
  const [offersOther, setOffersOther] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consented, setConsented] = useState(hasConsented);

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
      // Redirect based on check-in status
      router.push(`/${eventSlug}`);
      router.refresh();
    }
  };

  const submitIntakeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await submitIntake(eventId, eventSlug, {
      goals,
      goalsOther: goals.includes("other") ? goalsOther : undefined,
      offers,
      offersOther: offers.includes("other") ? offersOther : undefined,
      roleCategory,
      founderStage: roleCategory === "founder" ? (founderStage || undefined) : undefined,
      yearsExperience: roleCategory === "professional" && yearsExperience
        ? Number(yearsExperience)
        : undefined,
      degreeType: roleCategory === "student" ? (degreeType || undefined) : undefined,
      linkedin: linkedin.trim() ? linkedin.trim() : undefined,
      github: github.trim() ? github.trim() : undefined,
      website: website.trim() ? website.trim() : undefined,
      intent: intent.trim() ? intent.trim() : undefined,
      followupConsent: typeof followupConsent === "boolean" ? followupConsent : undefined,
      cursorExperience,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Redirect based on check-in status
      router.push(`/${eventSlug}`);
      router.refresh();
    }
  }, [eventId, eventSlug, goals, goalsOther, offers, offersOther, router]);

  const handleSubmit = async () => {
    if (step === "profile") {
      setStep("goals");
      return;
    }

    if (step === "goals") {
      setStep("offers");
      return;
    }

    // Check consent before submitting
    if (!consented) {
      setShowConsentModal(true);
      return;
    }

    await submitIntakeData();
  };

  const handleConsentSuccess = () => {
    setConsented(true);
    setShowConsentModal(false);
    // Automatically submit after consent
    submitIntakeData();
  };

  return (
    <>
      {showConsentModal && (
        <SurveyConsentModal
          eventId={eventId}
          eventSlug={eventSlug}
          userEmail={userEmail}
          onClose={() => setShowConsentModal(false)}
          onSuccess={handleConsentSuccess}
        />
      )}
      <div className="glass rounded-[40px] p-10 space-y-10 max-w-lg mx-auto relative overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">
          {step === "profile" ? "Step 01" : step === "goals" ? "Step 02" : "Step 03"}
        </p>
        <button 
          onClick={handleSkip} 
          disabled={loading}
          className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.3em] hover:text-white transition-colors"
        >
          Skip for Now
        </button>
      </div>

      {/* Consent explanation */}
      <div className="glass rounded-2xl p-4 bg-white/[0.02] border-white/5 space-y-2">
        <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-medium">
          ✓ Optional & Voluntary
        </p>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          This data helps us match you with relevant people and opportunities. You can skip this step and still participate in all event features. Data is only used for this event and will not be shared externally. Your intake responses will be automatically deleted {retentionDays} days after the event ends, in accordance with our data retention policy.
        </p>
      </div>

      <div className="space-y-10">
        {step === "profile" ? (
          <>
            <h3 className="text-3xl font-light text-white tracking-tight leading-tight">
              Tell us about your background
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-700 font-medium">
                  Role
                </label>
                <select
                  value={roleCategory}
                  onChange={(e) => setRoleCategory(e.target.value as AttendeeRoleCategory)}
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-700 font-medium">
                  Stage
                </label>
                <select
                  value={careerStage}
                  onChange={(e) => setCareerStage(e.target.value as CareerStage)}
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                >
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {roleCategory === "founder" && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-700 font-medium">
                    Company Stage
                  </label>
                  <select
                    value={founderStage}
                    onChange={(e) => setFounderStage(e.target.value as FounderStage)}
                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="" className="bg-black">Select stage</option>
                    {FOUNDER_STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-black">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {roleCategory === "professional" && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-700 font-medium">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-transparent border-b border-white/10 rounded-none py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-lg font-light"
                  />
                </div>
              )}

              {roleCategory === "student" && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-700 font-medium">
                    Degree Type
                  </label>
                  <select
                    value={degreeType}
                    onChange={(e) => setDegreeType(e.target.value as DegreeType)}
                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="" className="bg-black">Select degree</option>
                    {DEGREE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-black">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-700 font-medium">
                  Socials or Website
                </label>
                <input
                  type="text"
                  value={socials}
                  onChange={(e) => setSocials(e.target.value)}
                  placeholder="LinkedIn, website, or handle"
                  className="w-full bg-transparent border-b border-white/10 rounded-none py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-lg font-light"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-700 font-medium">
                  Experience with Cursor
                </label>
                <select
                  value={cursorExperience}
                  onChange={(e) => setCursorExperience(e.target.value as CursorExperience)}
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
                >
                  {CURSOR_EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-3xl font-light text-white tracking-tight leading-tight">
              {step === "goals" ? "What are you looking for?" : "What can you share?"}
            </h3>

            {/* Tag selection - Ultra Minimal Grid */}
            <div className="grid grid-cols-2 gap-4">
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
                    className={`p-5 rounded-3xl border text-[10px] font-medium uppercase tracking-[0.1em] text-center transition-all duration-500 flex items-center justify-center leading-relaxed ${
                      isSelected
                        ? "border-white/20 bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-105"
                        : "border-white/[0.03] bg-white/[0.01] text-gray-600 hover:border-white/10 hover:text-gray-400"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Other text input - Underline style */}
            {(step === "goals" ? goals : offers).includes("other") && (
              <div className="animate-fade-in">
                <textarea
                  placeholder="Tell us more"
                  value={step === "goals" ? goalsOther : offersOther}
                  onChange={(e) =>
                    step === "goals"
                      ? setGoalsOther(e.target.value)
                      : setOffersOther(e.target.value)
                  }
                  rows={2}
                  disabled={loading}
                  className="w-full bg-transparent border-b border-white/10 rounded-none py-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-lg font-light resize-none leading-relaxed"
                />
              </div>
            )}
          </>
        )}

        {error && (
          <div className="text-center p-4 rounded-2xl bg-red-500/5 text-red-400/80 text-[10px] font-medium uppercase tracking-widest animate-fade-in">
            {error}
          </div>
        )}

        <div className="flex gap-4 pt-6">
          {step === "offers" && (
            <button
              onClick={() => setStep("goals")}
              disabled={loading}
              className="aspect-square w-16 flex items-center justify-center rounded-full bg-white/[0.02] border border-white/5 text-gray-600 hover:text-white hover:border-white/20 transition-all"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          {step === "goals" && (
            <button
              onClick={() => setStep("profile")}
              disabled={loading}
              className="aspect-square w-16 flex items-center justify-center rounded-full bg-white/[0.02] border border-white/5 text-gray-600 hover:text-white hover:border-white/20 transition-all"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <button
            className="flex-1 h-16 rounded-full bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "..." : step === "profile" ? "Continue" : step === "goals" ? "Continue" : "Complete"}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
