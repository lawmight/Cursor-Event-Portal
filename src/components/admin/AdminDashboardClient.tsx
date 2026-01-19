"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserCheck,
  MessageCircle,
  ClipboardCheck,
  ArrowRight,
  Download,
  Megaphone,
  Upload,
  Sparkles,
  Vote,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Event, Question } from "@/types";

interface AdminDashboardClientProps {
  event: Event;
  eventSlug: string;
  adminCode: string;
  initialOpenQuestions: number;
  initialQuestions: Question[];
}

// Helper functions for localStorage tracking
function getSeenQuestionIds(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("seen-question-ids");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function markQuestionAsSeen(questionId: string) {
  if (typeof window === "undefined") return;
  const seen = getSeenQuestionIds();
  if (!seen.includes(questionId)) {
    seen.push(questionId);
    // Keep only last 100 to avoid localStorage bloat
    const trimmed = seen.slice(-100);
    localStorage.setItem("seen-question-ids", JSON.stringify(trimmed));
  }
}

function markAllQuestionsAsSeen(questionIds: string[]) {
  if (typeof window === "undefined") return;
  const seen = getSeenQuestionIds();
  const updated = [...new Set([...seen, ...questionIds])];
  // Keep only last 100
  const trimmed = updated.slice(-100);
  localStorage.setItem("seen-question-ids", JSON.stringify(trimmed));
}

export function AdminDashboardClient({
  event,
  eventSlug,
  adminCode,
  initialOpenQuestions,
  initialQuestions,
}: AdminDashboardClientProps) {
  const pathname = usePathname();
  const [openQuestions, setOpenQuestions] = useState(initialOpenQuestions);
  const [questions, setQuestions] = useState(initialQuestions);
  const [newQuestionAlert, setNewQuestionAlert] = useState(false);

  // Check for new questions and subscribe to changes
  useEffect(() => {
    const checkNewQuestions = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("questions")
        .select("id, status, created_at")
        .eq("event_id", event.id)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (!data) {
        setOpenQuestions(0);
        setNewQuestionAlert(false);
        return;
      }

      const openQ = data.length;
      setOpenQuestions(openQ);

      // Only show alert if there are open questions that haven't been seen
      if (openQ > 0 && !pathname.includes("/qa")) {
        const seenIds = getSeenQuestionIds();
        const unseenQuestions = data.filter((q) => !seenIds.includes(q.id));
        setNewQuestionAlert(unseenQuestions.length > 0);
      } else {
        setNewQuestionAlert(false);
      }

      // Update questions state - filter to open questions only
      const openQData = data.filter((q) => q.status === "open");
      setQuestions(openQData as Question[]);
    };

    checkNewQuestions();

    // Subscribe to question changes
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-questions-alert-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          checkNewQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, pathname]);

  // Mark questions as seen when on Q&A page
  useEffect(() => {
    if (pathname.includes("/qa")) {
      const openQuestionIds = questions
        .filter((q) => q.status === "open")
        .map((q) => q.id);
      if (openQuestionIds.length > 0) {
        markAllQuestionsAsSeen(openQuestionIds);
        setNewQuestionAlert(false);
      }
    }
  }, [pathname, questions]);

  return (
    <Link href={`/admin/${eventSlug}/${adminCode}/qa`} className="animate-slide-up" style={{ animationDelay: "800ms" }}>
      <div className="glass rounded-[40px] p-8 border-white/20 hover:bg-white/10 hover:shadow-glow transition-all group cursor-pointer relative overflow-hidden shadow-sm">
        {/* New Question Alert Indicator */}
        {newQuestionAlert && (
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75" />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all shadow-inner-glow relative">
              <MessageCircle className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
              {/* Alert indicator on icon */}
              {newQuestionAlert && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-light tracking-tight text-white/90">
                Q&A
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
                {openQuestions} Unresolved
                {newQuestionAlert && (
                  <span className="ml-2 text-green-400">• New</span>
                )}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
