import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getQuestions, getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { EventHeader } from "@/components/layout/EventHeader";
import { EventNav } from "@/components/layout/EventNav";
import { QuestionCard } from "@/components/qa/QuestionCard";
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

  // Separate pinned questions
  const pinnedQuestions = questions.filter((q) => q.status === "pinned");
  const otherQuestions = questions.filter((q) => q.status !== "pinned");

  return (
    <div className="min-h-screen bg-black-gradient flex flex-col pb-40">
      <EventHeader event={event} announcement={latestAnnouncement} />

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

        {/* Questions List */}
        <div className="space-y-12">
          {/* Pinned Questions */}
          {pinnedQuestions.length > 0 && (
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center gap-4 px-2">
                <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">
                  Featured
                </p>
                <div className="h-[1px] flex-1 bg-white/[0.03]" />
              </div>
              <div className="space-y-6">
                {pinnedQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    eventSlug={eventSlug}
                    userRole={user?.role}
                    userId={session.userId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Questions */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
            {pinnedQuestions.length > 0 && (
              <div className="flex items-center gap-4 px-2">
                <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">
                  Recent
                </p>
                <div className="h-[1px] flex-1 bg-white/[0.03]" />
              </div>
            )}

            {otherQuestions.length === 0 ? (
              <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-[40px] border-dashed opacity-40">
                <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em] font-medium">
                  Awaiting first inquiry
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {otherQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    eventSlug={eventSlug}
                    userRole={user?.role}
                    userId={session.userId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <EventNav eventSlug={eventSlug} />
    </div>
  );
}
