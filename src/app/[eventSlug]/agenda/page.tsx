import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getAgendaItems, getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { getIntakeStatus } from "@/lib/actions/intake";
import { getSurveyConsentStatus } from "@/lib/actions/consent";
import { createServiceClient } from "@/lib/supabase/server";
import { EventHeader } from "@/components/layout/EventHeader";
import { EventNavWrapper } from "@/components/layout/EventNavWrapper";
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

  // Redirect to intake if not completed or skipped (introductory screen)
  const intakeStatus = await getIntakeStatus(event.id, session.userId);
  if (!intakeStatus.completed && !intakeStatus.skipped) {
    redirect(`/${eventSlug}/intake`);
  }

  // Check survey consent status
  const consentStatus = await getSurveyConsentStatus(event.id, session.userId);
  
  // Get user email for consent display
  const supabase = await createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", session.userId)
    .single();

  const [items, announcements] = await Promise.all([
    getAgendaItems(event.id),
    getAnnouncements(event.id),
  ]);

  const latestAnnouncement = announcements[0] || null;

  return (
    <div className="min-h-screen bg-black-gradient flex flex-col pb-56 relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />
      
      <EventHeader event={event} announcement={latestAnnouncement} userId={session.userId} />

      <main className="max-w-[704px] mx-auto w-full px-6 py-12 space-y-12">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium animate-slide-up" style={{ animationDelay: "100ms" }}>
            Schedule
          </p>
          <h1 className="text-4xl font-light text-white tracking-tight animate-slide-up" style={{ animationDelay: "200ms" }}>
            Agenda
          </h1>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <AgendaList 
            items={items} 
            eventId={event.id} 
            eventTimezone={event.timezone || "America/Edmonton"}
            eventStartTime={event.start_time}
          />
        </div>
      </main>

      <EventNavWrapper eventSlug={eventSlug} event={event} userId={session.userId} />
    </div>
  );
}
