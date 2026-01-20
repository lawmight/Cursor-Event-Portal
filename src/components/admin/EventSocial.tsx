"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ClipboardCheck, Vote, Megaphone, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Event, Question } from "@/types";

interface EventSocialProps {
  event: Event;
  eventSlug: string;
  adminCode: string;
  initialOpenQuestions: number;
  initialQuestions: Question[];
  surveyResponses: number;
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

function markAllQuestionsAsSeen(questionIds: string[]) {
  if (typeof window === "undefined") return;
  const seen = getSeenQuestionIds();
  const updated = Array.from(new Set([...seen, ...questionIds]));
  const trimmed = updated.slice(-100);
  localStorage.setItem("seen-question-ids", JSON.stringify(trimmed));
}

type TabType = "qa" | "surveys" | "polls" | "announcements";

const TABS: Array<{ id: TabType; label: string; icon: typeof MessageCircle; href: (slug: string, code: string) => string }> = [
  {
    id: "qa",
    label: "Q&A",
    icon: MessageCircle,
    href: (slug, code) => `/admin/${slug}/${code}/qa`,
  },
  {
    id: "surveys",
    label: "Surveys",
    icon: ClipboardCheck,
    href: (slug, code) => `/admin/${slug}/${code}/surveys`,
  },
  {
    id: "polls",
    label: "Polls",
    icon: Vote,
    href: (slug, code) => `/admin/${slug}/${code}/polls`,
  },
  {
    id: "announcements",
    label: "Broadcast",
    icon: Megaphone,
    href: (slug, code) => `/admin/${slug}/${code}/announcements`,
  },
];

export function EventSocial({
  event,
  eventSlug,
  adminCode,
  initialOpenQuestions,
  initialQuestions,
  surveyResponses,
}: EventSocialProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>("qa");
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

    // Call async function and handle any errors
    checkNewQuestions().catch((err) => {
      console.error("Error checking new questions on mount:", err);
    });

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
          // Call async function without awaiting to avoid Promise serialization issues
          checkNewQuestions().catch((err) => {
            console.error("Error checking new questions:", err);
          });
        }
      );
    
    // Subscribe - just call it directly, no need to handle return value
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[EventSocial] Subscribed to questions");
      }
    });

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

  const getTabStats = (tab: TabType) => {
    switch (tab) {
      case "qa":
        return { count: openQuestions, label: "Unresolved", alert: newQuestionAlert };
      case "surveys":
        return { count: surveyResponses, label: "Responses", alert: false };
      case "polls":
        return { count: 0, label: "Active", alert: false };
      case "announcements":
        return { count: 0, label: "Published", alert: false };
      default:
        return { count: 0, label: "", alert: false };
    }
  };

  const activeTabData = TABS.find((tab) => tab.id === activeTab)!;
  const stats = getTabStats(activeTab);
  const Icon = activeTabData.icon;

  return (
    <div className="glass rounded-[40px] p-8 border-white/20 hover:bg-white/10 hover:shadow-glow transition-all group relative overflow-hidden shadow-sm animate-slide-up" style={{ animationDelay: "800ms" }}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const tabStats = getTabStats(tab.id);
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
              {tabStats.alert && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <Link href={activeTabData.href(eventSlug, adminCode)} className="block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all shadow-inner-glow relative">
              <Icon className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-light tracking-tight text-white/90">
                {activeTabData.label}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
                {stats.count} {stats.label}
                {stats.alert && (
                  <span className="ml-2 text-green-400">• New</span>
                )}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
    </div>
  );
}
