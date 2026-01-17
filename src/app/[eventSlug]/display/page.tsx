import { notFound } from "next/navigation";
import { getEventBySlug, getDisplayPageData } from "@/lib/supabase/queries";
import { EventDisplay } from "@/components/display/EventDisplay";

interface DisplayPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function DisplayPage({ params }: DisplayPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  const displayData = await getDisplayPageData(event.id);
  if (!displayData) {
    notFound();
  }

  return (
    <EventDisplay
      initialData={displayData}
      eventSlug={eventSlug}
      refreshInterval={30000}
    />
  );
}
