import { getEventBySlug } from "@/lib/supabase/queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventSlug: string }>;
}

export async function generateMetadata({ params }: EventLayoutProps): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    return {
      title: "Event Not Found | Cursor Pop-Up Portal",
    };
  }

  return {
    title: `${event.name} | Cursor Pop-Up Portal`,
    description: `Join us at ${event.venue || "the event"} for ${event.name}`,
  };
}

export default async function EventLayout({ children, params }: EventLayoutProps) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  return children;
}
