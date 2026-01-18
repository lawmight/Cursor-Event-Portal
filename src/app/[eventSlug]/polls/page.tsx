import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getActivePollsWithVotes, getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { getIntakeStatus } from "@/lib/actions/intake";
import { EventHeader } from "@/components/layout/EventHeader";
import { EventNav } from "@/components/layout/EventNav";
import { PollCard } from "@/components/polls/PollCard";

interface PollsPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function PollsPage({ params }: PollsPageProps) {
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

  const [polls, announcements] = await Promise.all([
    getActivePollsWithVotes(event.id, session.userId),
    getAnnouncements(event.id),
  ]);

  const latestAnnouncement = announcements[0] || null;

  return (
    <div className="min-h-screen bg-black-gradient flex flex-col pb-40">
      <EventHeader event={event} announcement={latestAnnouncement} />

      <main className="max-w-lg mx-auto w-full px-6 py-12 space-y-12">
        <div className="animate-fade-in space-y-2">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium">
            Live
          </p>
          <h1 className="text-4xl font-light text-white tracking-tight">
            Polls
          </h1>
        </div>

        <div className="space-y-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
          {polls.length === 0 ? (
            <div className="glass rounded-[40px] p-20 text-center space-y-4 border-dashed border-white/5 opacity-40">
              <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
                No active polls
              </p>
              <p className="text-xs text-gray-700">
                Check back when a poll is started
              </p>
            </div>
          ) : (
            polls.map((poll, index) => (
              <div
                key={poll.id}
                className="animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <PollCard poll={poll} eventSlug={eventSlug} />
              </div>
            ))
          )}
        </div>
      </main>

      <EventNav eventSlug={eventSlug} event={event} />
    </div>
  );
}
