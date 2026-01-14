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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <EventHeader event={event} announcement={latestAnnouncement} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Q&A
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask questions and get answers
            </p>
          </div>

          {/* Sort Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <a
              href={`/${eventSlug}/qa?sort=trending`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                sortBy === "trending"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Trending
            </a>
            <a
              href={`/${eventSlug}/qa?sort=new`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                sortBy === "new"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              New
            </a>
          </div>
        </div>

        {/* Question Form */}
        <QuestionForm eventId={event.id} eventSlug={eventSlug} />

        {/* Pinned Questions */}
        {pinnedQuestions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Pinned
            </h2>
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
        )}

        {/* All Questions */}
        <div className="space-y-3">
          {pinnedQuestions.length > 0 && (
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              All Questions
            </h2>
          )}

          {otherQuestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No questions yet. Be the first to ask!
              </p>
            </div>
          ) : (
            otherQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                eventSlug={eventSlug}
                userRole={user?.role}
                userId={session.userId}
              />
            ))
          )}
        </div>
      </main>

      <EventNav eventSlug={eventSlug} />
    </div>
  );
}
