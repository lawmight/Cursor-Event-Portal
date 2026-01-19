"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Calendar, MessageCircle, FolderOpen, BarChart3, Lock, FileText, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LiveSlidePopup } from "@/components/slides/LiveSlidePopup";
import { SlideDeckPopup } from "@/components/slides/SlideDeckPopup";
import type { Event } from "@/types";

interface EventNavProps {
  eventSlug: string;
  event?: Event;
}

const navItems = [
  { href: "agenda", label: "Agenda", icon: Calendar },
  { href: "qa", label: "Q&A", icon: MessageCircle },
  { href: "slides", label: "Slides", icon: FileText },
  { href: "polls", label: "Polls", icon: BarChart3, hasAlert: true },
  { href: "resources", label: "Resources", icon: FolderOpen },
];

export function EventNav({ eventSlug, event }: EventNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasActivePolls, setHasActivePolls] = useState(false);
  const [pollAlertVisible, setPollAlertVisible] = useState(false);
  const [isLockoutActive, setIsLockoutActive] = useState(event?.seat_lockout_active ?? false);
  const [hasLiveSlideDeck, setHasLiveSlideDeck] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Subscribe to lockout status changes
  useEffect(() => {
    if (!event) return;
    
    const supabase = createClient();
    const channel = supabase
      .channel(`event-lockout-nav-${event.id}`)
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
          setIsLockoutActive(newEvent.seat_lockout_active);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event]);

  // Check for live slide deck and subscribe to changes
  useEffect(() => {
    if (!event) return;

    const checkLiveSlideDeck = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("slide_decks")
        .select("id")
        .eq("event_id", event.id)
        .eq("is_live", true)
        .limit(1);

      setHasLiveSlideDeck((data?.length || 0) > 0);
    };

    checkLiveSlideDeck();

    const supabase = createClient();
    const channel = supabase
      .channel(`slide-decks-nav-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slide_decks",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          checkLiveSlideDeck();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event]);

  // Get seen poll IDs from localStorage
  const getSeenPollIds = (): string[] => {
    if (typeof window === "undefined") return [];
    const seen = localStorage.getItem(`polls-seen-${eventSlug}`);
    return seen ? JSON.parse(seen) : [];
  };

  // Mark polls as seen when visiting polls page
  useEffect(() => {
    if (pathname.includes("/polls")) {
      const markPollsAsSeen = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("polls")
          .select("id")
          .eq("is_active", true);

        if (data && data.length > 0) {
          const seenIds = getSeenPollIds();
          const allIds = [...seenIds, ...data.map((p) => p.id)];
          const newSeenIds = Array.from(new Set(allIds));
          localStorage.setItem(`polls-seen-${eventSlug}`, JSON.stringify(newSeenIds));
          setPollAlertVisible(false);
        }
      };

      markPollsAsSeen();
    }
  }, [pathname, eventSlug]);

  // Check for active polls and subscribe to changes
  useEffect(() => {
    const checkActivePolls = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("polls")
        .select("id")
        .eq("is_active", true);

      if (!data) {
        setHasActivePolls(false);
        setPollAlertVisible(false);
        return;
      }

      const hasPolls = data.length > 0;
      setHasActivePolls(hasPolls);

      // Only show alert if there are active polls that haven't been seen
      if (hasPolls && !pathname.includes("/polls")) {
        const seenIds = getSeenPollIds();
        const unseenPolls = data.filter((p) => !seenIds.includes(p.id));
        setPollAlertVisible(unseenPolls.length > 0);
      } else {
        setPollAlertVisible(false);
      }
    };

    checkActivePolls();

    // Subscribe to poll changes
    const supabase = createClient();
    const channel = supabase
      .channel("polls-nav")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        () => {
          checkActivePolls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname, eventSlug]);

  // Close mobile menu when navigating
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const renderNavItems = () => (
    navItems.map((item) => {
      const isActive = pathname.includes(`/${eventSlug}/${item.href}`);
      const Icon = item.icon;
      const showPollAlert =
        item.hasAlert && hasActivePolls && pollAlertVisible && !isActive;

      // During lockout, only Agenda is accessible
      const isDisabled = isLockoutActive && item.href !== "agenda";
      // Slides tab is always visible but grayed out when deck isn't live
      const isSlideDeckNotLive = item.href === "slides" && !hasLiveSlideDeck;

      if (isDisabled) {
        return (
          <div
            key={item.href}
            className="flex flex-col items-center justify-center gap-1.5 py-4 w-full transition-all duration-300 relative group text-gray-800 cursor-not-allowed"
          >
            <div className="transition-all duration-300 relative opacity-40">
              <Icon className="w-5 h-5 stroke-[1.5px]" />
              <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-gray-600" />
            </div>
          </div>
        );
      }

      // If slide deck is not live, render as non-clickable div with tooltip
      if (isSlideDeckNotLive) {
        return (
          <div
            key={item.href}
            className="flex flex-col items-center justify-center gap-1.5 py-4 w-full transition-all duration-300 relative group text-gray-600 cursor-default"
          >
            <div className="transition-all duration-300 relative opacity-40">
              <Icon className="w-5 h-5 stroke-[1.5px]" />
            </div>
            <span
              className={cn(
                "text-[8px] font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap mt-1 opacity-0 absolute translate-y-1"
              )}
            >
              {item.label}
            </span>
            {/* Tooltip on hover */}
            <div className="absolute left-full ml-3 px-2 py-1 bg-black/90 border border-white/10 rounded-lg text-[9px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Available at Event Start
            </div>
          </div>
        );
      }

      return (
        <Link
          key={item.href}
          href={`/${eventSlug}/${item.href}`}
          onClick={handleNavClick}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 py-4 w-full transition-all duration-300 relative group",
            isActive
              ? "text-white"
              : "text-gray-600 hover:text-white"
          )}
        >
          <div className={cn(
            "transition-all duration-300 relative",
            isActive && "scale-110"
          )}>
            <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />

            {/* Poll alert indicator */}
            {showPollAlert && (
              <div className="absolute -top-1 -right-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping opacity-75" />
              </div>
            )}
          </div>
          <span
            className={cn(
              "text-[8px] font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap mt-1",
              isActive ? "opacity-40 translate-y-0" : "opacity-0 absolute translate-y-1"
            )}
          >
            {item.label}
          </span>

          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          )}
        </Link>
      );
    })
  );

  return (
    <>
      {/* Live Slide Popup - shows on right side when slides are live */}
      {event && <LiveSlidePopup eventId={event.id} eventSlug={eventSlug} />}
      {/* Slide Deck Popup - shows on right side when popup is enabled */}
      {event && <SlideDeckPopup eventId={event.id} eventSlug={eventSlug} />}

      {/* Desktop Nav - hidden on mobile */}
      <nav className="hidden md:block fixed left-6 top-1/2 -translate-y-1/2 z-50 p-4 pointer-events-none">
        <div className="glass rounded-[40px] border border-white/5 w-20 pointer-events-auto shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all duration-300 hover:w-24 hover:shadow-[0_30px_60px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.1)]">
          <div className="py-6">
            <div className="flex flex-col items-center gap-4">
              {renderNavItems()}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav - collapsible bubble in bottom left */}
      <div
        className="md:hidden"
        style={{ position: 'fixed', left: '1rem', bottom: '1rem', top: 'auto', zIndex: 50 }}
      >
          {/* Expanded menu */}
          <div
            className={cn(
              "glass rounded-[32px] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.8)] mb-3 transition-all duration-300 origin-bottom-left overflow-hidden",
              isMobileMenuOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-75 pointer-events-none"
            )}
          >
            <div className="py-4 px-2 w-20">
              <div className="flex flex-col items-center gap-2">
                {renderNavItems()}
              </div>
            </div>
          </div>

          {/* Toggle bubble button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "glass w-14 h-14 rounded-full border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 active:scale-95 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(255,255,255,0.1)]",
              isMobileMenuOpen ? "bg-white/10" : "bg-black/40"
            )}
          >
            <div className="relative">
              <Menu
                className={cn(
                  "w-6 h-6 text-white transition-all duration-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  isMobileMenuOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                )}
              />
              <X
                className={cn(
                  "w-6 h-6 text-white transition-all duration-300",
                  isMobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                )}
              />
            </div>

            {/* Poll alert on bubble when menu closed */}
            {!isMobileMenuOpen && pollAlertVisible && hasActivePolls && (
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75" />
              </div>
            )}
          </button>
      </div>
    </>
  );
}
