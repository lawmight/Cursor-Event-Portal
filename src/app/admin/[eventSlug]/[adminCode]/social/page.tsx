"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MessageCircle, ClipboardCheck, Vote, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";

interface EventSocialPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
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

export default function EventSocialPage({ params }: EventSocialPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("qa");
  const [eventSlug, setEventSlug] = useState<string>("");
  const [adminCode, setAdminCode] = useState<string>("");

  // Get params
  params.then(({ eventSlug: slug, adminCode: code }) => {
    if (slug !== eventSlug) setEventSlug(slug);
    if (code !== adminCode) setAdminCode(code);
  });

  const currentIndex = TABS.findIndex((t) => t.id === activeTab);

  const goToPrev = () => {
    const newIndex = currentIndex === 0 ? TABS.length - 1 : currentIndex - 1;
    setActiveTab(TABS[newIndex].id);
  };

  const goToNext = () => {
    const newIndex = currentIndex === TABS.length - 1 ? 0 : currentIndex + 1;
    setActiveTab(TABS[newIndex].id);
  };

  const activeTabData = TABS.find((t) => t.id === activeTab)!;
  const Icon = activeTabData.icon;

  const getHref = (tabId: TabType) => {
    switch (tabId) {
      case "qa":
        return `/admin/${eventSlug}/${adminCode}/qa`;
      case "surveys":
        return `/admin/${eventSlug}/${adminCode}/surveys`;
      case "polls":
        return `/admin/${eventSlug}/${adminCode}/polls`;
      case "announcements":
        return `/admin/${eventSlug}/${adminCode}/announcements`;
    }
  };

  if (!eventSlug || !adminCode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

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

      <main className="max-w-4xl mx-auto px-6 py-12 w-full z-10 flex-1">
        {/* Tab Carousel */}
        <div className="glass rounded-[48px] p-12 border-white/20 mb-8">
          {/* Tab Pills */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                    isActive
                      ? "bg-white text-black"
                      : "bg-white/5 text-gray-500 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Carousel Navigation */}
          <div className="flex items-center justify-between gap-8">
            <button
              onClick={goToPrev}
              className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-gray-400" />
            </button>

            {/* Active Tab Display */}
            <Link href={getHref(activeTab)} className="flex-1">
              <div className="glass rounded-[40px] p-10 border-white/10 hover:bg-white/5 hover:border-white/20 transition-all group cursor-pointer text-center">
                <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/[0.05] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all">
                  <Icon className="w-10 h-10 text-gray-500 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-3xl font-light tracking-tight text-white/90 mb-2">
                  {activeTabData.label}
                </h2>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-600 font-medium">
                  {activeTabData.description}
                </p>
              </div>
            </Link>

            <button
              onClick={goToNext}
              className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Link key={tab.id} href={getHref(tab.id)}>
                <div
                  className={`glass rounded-2xl p-6 border transition-all cursor-pointer text-center ${
                    isActive
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <TabIcon className={`w-6 h-6 mx-auto mb-3 ${isActive ? "text-white" : "text-gray-600"}`} />
                  <p className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-500"}`}>
                    {tab.label}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
