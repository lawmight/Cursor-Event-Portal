"use client";

import dynamic from "next/dynamic";
import type { Event } from "@/types";

// Dynamically import EventNav with SSR disabled to prevent hydration mismatch
const EventNav = dynamic(
  () => import("./EventNav").then((mod) => mod.EventNav),
  { ssr: false }
);

interface EventNavWrapperProps {
  eventSlug: string;
  event?: Event;
  userId?: string;
}

export function EventNavWrapper({ eventSlug, event, userId }: EventNavWrapperProps) {
  return <EventNav eventSlug={eventSlug} event={event} userId={userId} />;
}
