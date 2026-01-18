"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntakeOptInBannerProps {
  eventSlug: string;
  onDismiss?: () => void;
}

export function IntakeOptInBanner({ eventSlug, onDismiss }: IntakeOptInBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
    // Store dismissal in localStorage so it doesn't reappear
    localStorage.setItem(`intake-banner-dismissed-${eventSlug}`, "true");
  };

  // Check if already dismissed
  if (dismissed) return null;
  
  return (
    <div className={cn(
      "glass rounded-[40px] p-6 border-white/10 relative overflow-hidden animate-slide-up",
      "bg-gradient-to-br from-white/[0.08] to-white/[0.02]"
    )}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/[0.05] flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white/60" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-light text-white tracking-tight mb-1">
              Enhance Your Networking
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Share what you're looking for and what you can offer to help us match you with the right people. This is completely optional and only used to enhance your experience.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/${eventSlug}/intake`}
              className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-gray-200 transition-all text-[10px] uppercase tracking-[0.2em] font-bold shadow-xl"
            >
              Share Signals
            </Link>
            <button
              onClick={handleDismiss}
              className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all text-[10px] uppercase tracking-[0.2em] font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

