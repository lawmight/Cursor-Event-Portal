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
    <nav className="fixed bottom-8 left-0 right-0 z-50 safe-area-pb p-4 pointer-events-none">
      <div className="glass rounded-[40px] border border-white/5 max-w-sm mx-auto pointer-events-auto shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
        <div className="px-4">
          <div className="flex items-center justify-between h-20">
            {navItems.map((item) => {
              const isActive = pathname.includes(`/${eventSlug}/${item.href}`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={`/${eventSlug}/${item.href}`}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 px-4 h-full transition-all duration-300 relative group",
                    isActive
                      ? "text-white"
                      : "text-gray-600 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "transition-all duration-300",
                    isActive && "scale-110"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
                  </div>
                  <span
                    className={cn(
                      "text-[8px] font-bold uppercase tracking-[0.2em] transition-all absolute -bottom-1 whitespace-nowrap",
                      isActive ? "opacity-40 translate-y-0" : "opacity-0 translate-y-1"
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
