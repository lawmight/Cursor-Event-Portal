"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ClipboardCheck, X, ChevronRight } from "lucide-react";
import type { Event, Survey } from "@/types";

interface SurveyPopupAlertProps {
  event: Event;
  eventSlug: string;
  initialSurvey: Survey | null;
  userId?: string | null;
}

export function SurveyPopupAlert({
  event,
  eventSlug,
  initialSurvey,
  userId,
}: SurveyPopupAlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(initialSurvey);
  const [popupEnabled, setPopupEnabled] = useState(event.survey_popup_visible ?? false);

  // Sync survey from prop when it changes
  useEffect(() => {
    setSurvey(initialSurvey);
  }, [initialSurvey]);

  // Check if user has already completed the survey
  useEffect(() => {
    const checkCompletion = async () => {
      if (!survey || !userId) return;

      const supabase = createClient();
      const { data } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("survey_id", survey.id)
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (data) {
        setHasCompleted(true);
      }
    };

    checkCompletion();
  }, [survey, userId]);

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissedKey = `survey_popup_dismissed_${event.id}`;
    const dismissedAt = localStorage.getItem(dismissedKey);
    if (dismissedAt) {
      // Dismissed in the last 1 hour
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }
  }, [event.id]);

  // Subscribe to real-time changes for popup visibility
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`survey_popup_${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${event.id}`,
        },
        (payload) => {
          const newEvent = payload.new as Event;
          setPopupEnabled(newEvent.survey_popup_visible);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id]);

  // Determine visibility
  useEffect(() => {
    const shouldShow = popupEnabled && survey && !hasCompleted && !isDismissed;

    // Small delay to make it feel more natural
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [popupEnabled, survey, hasCompleted, isDismissed]);

  const handleDismiss = () => {
    const dismissedKey = `survey_popup_dismissed_${event.id}`;
    localStorage.setItem(dismissedKey, Date.now().toString());
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-40 animate-slide-up">
      <div className="glass rounded-3xl p-5 border border-green-500/20 bg-green-500/5 shadow-[0_0_40px_rgba(74,222,128,0.1)]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-white font-medium text-sm">Quick Survey</h3>
                <p className="text-gray-400 text-xs mt-1">
                  Share your feedback - takes less than a minute
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Link
                href={`/${eventSlug}/feedback`}
                className="flex-1 h-10 rounded-xl bg-green-500 text-black font-bold text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-green-400 transition-all"
              >
                Fill Survey
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDismiss}
                className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-[10px] uppercase tracking-[0.15em] font-medium hover:text-white transition-all"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
