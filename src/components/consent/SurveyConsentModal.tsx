"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitSurveyConsent } from "@/lib/actions/consent";
import { communityOrganizersName } from "@/content/site.config";

interface SurveyConsentModalProps {
  eventId: string;
  eventSlug: string;
  userEmail: string | null;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function SurveyConsentModal({
  eventId,
  eventSlug,
  userEmail,
  onClose,
  onSuccess,
}: SurveyConsentModalProps) {
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consented) {
      setError("Please agree to continue");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await submitSurveyConsent(eventId, eventSlug, consented);
      
      if (result.error) {
        setError(result.error);
        setSubmitting(false);
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md glass rounded-[32px] p-8 border border-white/10 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-xl font-light text-white tracking-tight">
              Data Consent
            </h2>
            <p className="text-xs text-gray-400">
              Required to share your goals
            </p>
          </div>

          {/* Concise Consent Text */}
          <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
            <p>
              By sharing your goals, you agree that <strong className="text-white">{communityOrganizersName()}</strong> may use your survey responses and feedback to:
            </p>

            <ul className="list-disc list-inside space-y-1.5 ml-2 text-xs">
              <li>Improve the quality of future events</li>
              <li>Facilitate networking and connections at this event</li>
              <li>Conduct internal analysis for event management</li>
            </ul>

            <p className="text-xs text-gray-400 pt-2 border-t border-white/10">
              <strong className="text-white">Important:</strong> Your data is <strong className="text-white">not sold</strong> and is <strong className="text-white">not tied to your name</strong> in any public way. It is used anonymously to improve future events. You can withdraw consent anytime.
            </p>
          </div>

          {/* Consent Checkbox */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setConsented(!consented)}
                className={cn(
                  "w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  consented
                    ? "bg-white border-white text-black"
                    : "bg-transparent border-white/30 text-transparent hover:border-white/50"
                )}
              >
                {consented && <Check className="w-3 h-3" />}
              </button>
              <label
                onClick={() => setConsented(!consented)}
                className="flex-1 text-xs text-gray-300 leading-relaxed cursor-pointer"
              >
                I consent to the collection and use of my feedback and data by {communityOrganizersName()} to improve future events. I understand my data is not sold and not tied to my name publicly.
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-xs font-medium uppercase tracking-widest"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!consented || submitting}
                className={cn(
                  "flex-1 h-11 rounded-full font-bold uppercase tracking-widest text-xs transition-all",
                  consented && !submitting
                    ? "bg-white text-black hover:scale-[1.02] shadow-lg"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                )}
              >
                {submitting ? "..." : "Agree & Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

