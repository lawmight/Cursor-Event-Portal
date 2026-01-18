"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Calendar, MessageCircle, FolderOpen, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EventNavProps {
  eventSlug: string;
}

const navItems = [
  { href: "agenda", label: "Agenda", icon: Calendar },
  { href: "qa", label: "Q&A", icon: MessageCircle },
  { href: "polls", label: "Polls", icon: BarChart3, hasAlert: true },
  { href: "resources", label: "Resources", icon: FolderOpen },
];

export function EventNav({ eventSlug }: EventNavProps) {
  const pathname = usePathname();
  const [hasActivePolls, setHasActivePolls] = useState(false);
  const [pollAlertVisible, setPollAlertVisible] = useState(false);

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
          const newSeenIds = [...new Set([...seenIds, ...data.map((p) => p.id)])];
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

  return (
    <nav className="fixed bottom-8 left-0 right-0 z-50 safe-area-pb p-4 pointer-events-none">
      <div className="glass rounded-[40px] border border-white/5 max-w-md mx-auto pointer-events-auto shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
        <div className="px-2">
          <div className="flex items-center justify-between h-20">
            {navItems.map((item) => {
              const isActive = pathname.includes(`/${eventSlug}/${item.href}`);
              const Icon = item.icon;
              const showPollAlert =
                item.hasAlert && hasActivePolls && pollAlertVisible && !isActive;

              return (
                <Link
                  key={item.href}
                  href={`/${eventSlug}/${item.href}`}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 px-3 h-full transition-all duration-300 relative group",
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
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
