import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getAnnouncements, getSlideDeck } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { EventHeader } from "@/components/layout/EventHeader";
import { EventNav } from "@/components/layout/EventNav";
import { PdfDeckViewer } from "@/components/slides/PdfDeckViewer";

interface SlidesPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function SlidesPage({ params }: SlidesPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  const session = await getSession();
  if (!session || session.eventId !== event.id) {
    redirect(`/${eventSlug}`);
  }

  const [slideDeck, announcements] = await Promise.all([
    getSlideDeck(event.id),
    getAnnouncements(event.id),
  ]);

  const latestAnnouncement = announcements[0] || null;

  return (
    <div className="min-h-screen bg-black-gradient flex flex-col pb-40 relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />
      
      <EventHeader event={event} announcement={latestAnnouncement} userId={session.userId} />

      <main className="max-w-5xl mx-auto w-full px-6 py-12 space-y-10">
        <div className="animate-fade-in space-y-2">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium">
            Presentation
          </p>
          <h1 className="text-4xl font-light text-white tracking-tight">
            Slide Deck
          </h1>
        </div>

        {!slideDeck ? (
          <div className="text-center py-24 glass rounded-[40px] border-dashed border-white/5 opacity-40">
            <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
              No slide deck uploaded
            </p>
            <p className="text-[9px] text-gray-700 mt-2">
              The slide deck will appear here once it's been uploaded by the event organizer.
            </p>
          </div>
        ) : !slideDeck.is_live ? (
          <div className="text-center py-24 glass rounded-[40px] border-dashed border-white/5 opacity-60">
            <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
              Slide deck not yet available
            </p>
            <p className="text-[9px] text-gray-700 mt-2">
              The slide deck will be made available shortly. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="glass rounded-[40px] p-6 border border-white/10">
            <div className="aspect-video rounded-2xl overflow-hidden bg-white/5">
              <PdfDeckViewer pdfUrl={slideDeck.pdf_url} className="w-full h-full" />
            </div>
          </div>
        )}
      </main>

      <EventNav eventSlug={eventSlug} event={event} />
    </div>
  );
}
