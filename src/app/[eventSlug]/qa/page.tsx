import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getQuestions, getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { getIntakeStatus } from "@/lib/actions/intake";
import { EventHeader } from "@/components/layout/EventHeader";
import { EventNav } from "@/components/layout/EventNav";
import { QuestionsList } from "@/components/qa/QuestionsList";
import { QuestionForm } from "@/components/qa/QuestionForm";
import { createClient } from "@/lib/supabase/server";

interface QAPageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export default async function QAPage({ params, searchParams }: QAPageProps) {
  const { eventSlug } = await params;
  const { sort } = await searchParams;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  // Check if registered
  const session = await getSession();
  if (!session || session.eventId !== event.id) {
    redirect(`/${eventSlug}`);
  }

  // Redirect to intake if not completed or skipped
  const intakeStatus = await getIntakeStatus(event.id, session.userId);
  if (!intakeStatus.completed && !intakeStatus.skipped) {
    redirect(`/${eventSlug}/intake`);
  }

  const sortBy = sort === "new" ? "new" : "trending";

  const [questions, announcements] = await Promise.all([
    getQuestions(event.id, sortBy),
    getAnnouncements(event.id),
  ]);

  // Get user role
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  const latestAnnouncement = announcements[0] || null;

  return (
    <div className="min-h-screen bg-black-gradient flex flex-col pb-40">
      <EventHeader event={event} announcement={latestAnnouncement} userId={session.userId} />

      <main className="max-w-lg mx-auto w-full px-6 py-12 space-y-12">
        <div className="flex items-end justify-between animate-fade-in">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium">
              Interact
            </p>
            <h1 className="text-4xl font-light text-white tracking-tight">
              Q&A
            </h1>
          </div>

          {/* Sort Toggle - Sleek */}
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 rounded-full p-1 backdrop-blur-md">
            <a
              href={`/${eventSlug}/qa?sort=trending`}
              className={`px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full transition-all ${
                sortBy === "trending"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              Hot
            </a>
            <a
              href={`/${eventSlug}/qa?sort=new`}
              className={`px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full transition-all ${
                sortBy === "new"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              New
            </a>
          </div>
        </div>

        {/* Question Form */}
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <QuestionForm eventId={event.id} eventSlug={eventSlug} />
        </div>

        {/* Questions List with Real-time Updates */}
        <QuestionsList
          initialQuestions={questions}
          eventSlug={eventSlug}
          eventId={event.id}
          userRole={user?.role}
          userId={session.userId}
          sortBy={sortBy}
        />
      </main>

      <EventNav eventSlug={eventSlug} event={event} />
    </div>
  );
}
