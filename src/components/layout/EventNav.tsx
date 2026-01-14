"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, MessageCircle, FolderOpen, MessageSquare } from "lucide-react";

interface EventNavProps {
  eventSlug: string;
}

const navItems = [
  { href: "agenda", label: "Agenda", icon: Calendar },
  { href: "qa", label: "Q&A", icon: MessageCircle },
  { href: "resources", label: "Resources", icon: FolderOpen },
  { href: "feedback", label: "Feedback", icon: MessageSquare },
];

export function EventNav({ eventSlug }: EventNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="glass border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = pathname.includes(`/${eventSlug}/${item.href}`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={`/${eventSlug}/${item.href}`}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px]",
                    isActive
                      ? "text-cursor-purple bg-cursor-purple/10"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive && "scale-110"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide",
                      isActive && "text-cursor-purple"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
