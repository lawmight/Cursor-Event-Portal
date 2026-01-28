"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { recordPageView, type PageType, type DeviceType } from "@/lib/actions/analytics";

interface PageTrackerProps {
  eventId: string;
}

function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getPageType(pathname: string): PageType | null {
  if (pathname.includes("/admin")) return "admin";
  if (pathname.includes("/staff")) return "staff";
  if (pathname.includes("/display")) return "display";
  if (pathname.includes("/agenda")) return "agenda";
  if (pathname.includes("/qa") || pathname.includes("/questions")) return "qa";
  if (pathname.includes("/polls")) return "polls";
  if (pathname.includes("/slides")) return "slides";
  if (pathname.includes("/resources")) return "resources";
  if (pathname.includes("/feedback") || pathname.includes("/survey")) return "feedback";
  if (pathname.includes("/intake")) return "intake";
  if (pathname.includes("/register")) return "registration";
  // Landing page is typically the event root
  if (pathname.match(/^\/[^\/]+\/?$/)) return "landing";
  return null;
}

export function PageTracker({ eventId }: PageTrackerProps) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const pageStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Don't track the same page twice in a row
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    pageStartTime.current = Date.now();

    const pageType = getPageType(pathname);
    if (!pageType) return;

    // Get session ID from localStorage (or create one)
    let sessionId = localStorage.getItem("popup_session_id");
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("popup_session_id", sessionId);
    }

    recordPageView(eventId, pathname, pageType, {
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      sessionId,
    });
  }, [pathname, eventId]);

  return null;
}
