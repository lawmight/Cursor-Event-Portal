"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MessageCircle, ClipboardCheck, Vote, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminQAClient } from "../../qa/AdminQAClient";
import { PollsAdminClient } from "../../polls/PollsAdminClient";
import { AnnouncementsClient } from "../../announcements/AnnouncementsClient";
import { SurveysAdminClient } from "../../surveys/SurveysAdminClient";
import type { Event, Question, Poll, Announcement, Survey } from "@/types";

interface EventSocialClientProps {
  event: Event;
  eventSlug: string;
  adminCode: string;
  userId: string;
  initialQuestions: Question[];
  initialPolls: Poll[];
  initialAnnouncements: Announcement[];
  initialSurveys: Survey[];
  sortBy: "new" | "trending";
  statusFilter: "all" | "open" | "answered" | "pinned" | "hidden";
  activeTab: TabType;
}

type TabType = "qa" | "surveys" | "polls" | "announcements";

const TABS: Array<{ id: TabType; label: string; icon: typeof MessageCircle; description: string }> = [
  {
    id: "qa",
    label: "Q&A",
    icon: MessageCircle,
    description: "Manage audience questions",
  },
  {
    id: "surveys",
    label: "Surveys",
    icon: ClipboardCheck,
    description: "Collect feedback",
  },
  {
    id: "polls",
    label: "Polls",
    icon: Vote,
    description: "Live audience voting",
  },
  {
    id: "announcements",
    label: "Broadcast",
    icon: Megaphone,
    description: "Send announcements",
  },
];

export function EventSocialClient({ 
  event,
  eventSlug, 
  adminCode,
  userId,
  initialQuestions,
  initialPolls,
  initialAnnouncements,
  initialSurveys,
  sortBy,
  statusFilter,
  activeTab: initialActiveTab
}: EventSocialClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(initialActiveTab);

  // Sync state if prop changes (e.g. via URL navigation)
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  const currentIndex = TABS.findIndex((t) => t.id === activeTab);

  const updateTab = (newTab: TabType) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const goToPrev = () => {
    const newIndex = currentIndex === 0 ? TABS.length - 1 : currentIndex - 1;
    updateTab(TABS[newIndex].id);
  };

  const goToNext = () => {
    const newIndex = currentIndex === TABS.length - 1 ? 0 : currentIndex + 1;
    updateTab(TABS[newIndex].id);
  };

  const activeTabData = TABS.find((t) => t.id === activeTab)!;
  const Icon = activeTabData.icon;

  const renderActiveTab = () => {
    switch (activeTab) {
      case "qa":
        return (
          <AdminQAClient
            event={event}
            initialQuestions={initialQuestions}
            eventSlug={eventSlug}
            adminCode={adminCode}
            userId={userId}
            sortBy={sortBy}
            statusFilter={statusFilter}
            isEmbedded={true}
          />
        );
      case "polls":
        return (
          <PollsAdminClient
            event={event}
            eventSlug={eventSlug}
            adminCode={adminCode}
            initialPolls={initialPolls}
            isEmbedded={true}
          />
        );
      case "announcements":
        return (
          <AnnouncementsClient
            event={event}
            eventSlug={eventSlug}
            adminCode={adminCode}
            initialAnnouncements={initialAnnouncements}
            isEmbedded={true}
          />
        );
      case "surveys":
        return (
          <SurveysAdminClient
            event={event}
            eventSlug={eventSlug}
            adminCode={adminCode}
            initialSurveys={initialSurveys}
            isEmbedded={true}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      <AdminHeader
        eventSlug={eventSlug}
        adminCode={adminCode}
        subtitle="Event Social"
        showBackArrow={true}
      />

      <main className="max-w-4xl mx-auto px-6 py-8 w-full z-10 flex-1">
        {/* Compact Tab Carousel */}
        <div className="glass rounded-[32px] p-6 border-white/10 mb-12 relative overflow-hidden">
          {/* Subtle glow behind active icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Carousel Navigation */}
          <div className="flex items-center justify-between gap-6 relative z-10">
            <button
              onClick={goToPrev}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>

            {/* Active Tab Display - Compact & Elegant */}
            <div className="flex-1 flex items-center justify-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/[0.05] flex items-center justify-center shadow-inner-glow transition-transform duration-500">
                <Icon className="w-6 h-6 text-white/80" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-light tracking-tight text-white/90">
                  {activeTabData.label}
                </h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold">
                  {activeTabData.description}
                </p>
              </div>
            </div>

            <button
              onClick={goToNext}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2 mt-6 relative z-10">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => updateTab(tab.id)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white w-5 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    : "bg-white/10 hover:bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="animate-fade-in pb-20">
          {renderActiveTab()}
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-white/[0.03] flex justify-between items-center z-10 mt-auto">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">{activeTabData.label}</p>
        </div>
      </footer>
    </div>
  );
}
