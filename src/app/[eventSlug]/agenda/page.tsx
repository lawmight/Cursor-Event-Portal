import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getAgendaItems, getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { EventHeader } from "@/components/layout/EventHeader";
import { EventNav } from "@/components/layout/EventNav";
import { AgendaList } from "@/components/agenda/AgendaList";

interface AgendaPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AgendaPage({ params }: AgendaPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  // Check if registered
  const session = await getSession();
  if (!session || session.eventId !== event.id) {
    redirect(`/${eventSlug}`);
  }

  const [items, announcements] = await Promise.all([
    getAgendaItems(event.id),
    getAnnouncements(event.id),
  ]);

  const latestAnnouncement = announcements[0] || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <EventHeader event={event} announcement={latestAnnouncement} />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Agenda
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Today&apos;s schedule
          </p>
        </div>

        <AgendaList items={items} />
      </main>

      <EventNav eventSlug={eventSlug} />
    </div>
  );
}
