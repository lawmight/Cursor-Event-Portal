"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasDismissed, recordDismissal } from "@/lib/supabase/seenItems";

interface IntakeOptInBannerProps {
  eventSlug: string;
  eventId: string;
  userId?: string; // Optional: if provided, uses Supabase for dismissal tracking
  onDismiss?: () => void;
}

export function IntakeOptInBanner({ eventSlug, eventId, userId, onDismiss }: IntakeOptInBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if already dismissed (from Supabase)
  useEffect(() => {
    async function checkDismissed() {
      if (userId) {
        try {
          const isDismissed = await hasDismissed(userId, eventId, 'intake_banner');
          setDismissed(isDismissed);
        } catch (error) {
          console.error("[IntakeOptInBanner] Error checking dismissal:", error);
        }
      }
      setLoading(false);
    }

    checkDismissed();
  }, [userId, eventId]);

  const handleDismiss = async () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
    
    // Record dismissal in Supabase
    if (userId) {
      try {
        await recordDismissal(userId, eventId, 'intake_banner');
      } catch (error) {
        console.error("[IntakeOptInBanner] Error recording dismissal:", error);
      }
    }
  };

  // Don't render while loading or if dismissed
  if (loading || dismissed) return null;
  
  return (
    <div className={cn(
      "glass rounded-[40px] p-6 border-white/10 relative overflow-hidden animate-slide-up",
      "bg-linear-to-br from-white/8 to-white/2"
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
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-white/60" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-light text-white tracking-tight mb-1">
              Enhance Your Networking
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Share what you&apos;re looking for and what you can offer to help us match you with the right people. This is completely optional and only used to enhance your experience.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/${eventSlug}/intake`}
              className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-gray-200 transition-all text-[10px] uppercase tracking-[0.2em] font-bold shadow-xl"
            >
              Share Goals
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
