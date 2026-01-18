"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitSurveyConsent } from "@/lib/actions/consent";

interface SurveyConsentModalProps {
  eventId: string;
  eventSlug: string;
  userEmail: string | null;
}

export function SurveyConsentModal({
  eventId,
  eventSlug,
  userEmail,
}: SurveyConsentModalProps) {
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consented) {
      setError("You must agree to the terms to continue");
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
        // Success - modal will be hidden by parent component via refresh
        window.location.reload();
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl glass rounded-[40px] p-10 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-light text-white tracking-tight">
              Data Collection Consent
            </h2>
            <p className="text-sm text-gray-400">
              Required to access the event portal
            </p>
          </div>

          {/* Consent Text */}
          <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="font-medium text-white mb-4 text-base">
                By entering, you agree to:
              </p>
              
              <div className="space-y-4">
                <p>
                  The <strong className="text-white">Cursor Calgary community organizers</strong> may collect, 
                  use, and store your survey response data, including responses tied to your email address 
                  ({userEmail || "your provided email"}), for the following purposes:
                </p>

                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Event management and administration</li>
                  <li>Improving future events and community engagement</li>
                  <li>Internal analysis and reporting by event organizers</li>
                  <li>Facilitating networking and connections at this event</li>
                </ul>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400">
                    <strong className="text-white">Your Rights (PIPEDA Compliance):</strong> You have the right to 
                    access, correct, or withdraw your consent at any time by contacting the event organizers. 
                    Your data will be used only for the purposes stated above and will not be sold or shared 
                    with third parties without your explicit consent.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setConsented(!consented)}
                className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                  consented
                    ? "bg-white border-white text-black"
                    : "bg-transparent border-white/30 text-transparent hover:border-white/50"
                )}
              >
                {consented && <Check className="w-4 h-4" />}
              </button>
              <label
                onClick={() => setConsented(!consented)}
                className="flex-1 text-sm text-gray-300 leading-relaxed cursor-pointer"
              >
                <span className="text-white font-medium">I consent</span> to the collection, 
                use, and storage of my survey response data, including data tied to my email address, 
                by the Cursor Calgary community organizers for the purposes described above. I understand 
                that I can withdraw my consent at any time.
              </label>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!consented || submitting}
              className={cn(
                "w-full h-14 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl",
                consented && !submitting
                  ? "bg-white text-black hover:scale-[1.02] hover:shadow-2xl"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              {submitting ? "Processing..." : "I Agree & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
