import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getSlideDeck, getAnnouncements } from "@/lib/supabase/queries";
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
    <div className="min-h-screen bg-black-gradient flex flex-col pb-40">
      <EventHeader event={event} announcement={latestAnnouncement} userId={session.userId} />

      <main className="max-w-5xl mx-auto w-full px-6 py-12 space-y-10">
        <div className="animate-fade-in space-y-2">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium">
            Slide Deck
          </p>
          <h1 className="text-4xl font-light text-white tracking-tight">
            Event Slides
          </h1>
        </div>

        {slideDeck ? (
          <div className="glass rounded-[40px] p-6 border-white/[0.03]">
            <div className="w-full aspect-video bg-black/40 rounded-[28px] border border-white/10 overflow-hidden">
              <PdfDeckViewer pdfUrl={slideDeck.pdf_url} className="w-full h-full" />
            </div>
          </div>
        ) : (
          <div className="text-center py-24 glass rounded-[40px] border-dashed border-white/5 opacity-40">
            <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
              No deck uploaded yet
            </p>
          </div>
        )}
      </main>

      <EventNav eventSlug={eventSlug} event={event} />
    </div>
  );
}
