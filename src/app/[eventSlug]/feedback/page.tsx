import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getPublishedSurvey, getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { EventHeader } from "@/components/layout/EventHeader";
import { EventNav } from "@/components/layout/EventNav";
import { SurveyForm } from "@/components/survey/SurveyForm";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface FeedbackPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
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

  const [survey, announcements] = await Promise.all([
    getPublishedSurvey(event.id),
    getAnnouncements(event.id),
  ]);

  const latestAnnouncement = announcements[0] || null;

  return (
    <div className="min-h-screen bg-black-gradient flex flex-col pb-40">
      <EventHeader event={event} announcement={latestAnnouncement} />

      <main className="max-w-lg mx-auto w-full px-6 py-12 space-y-12">
        <div className="animate-fade-in space-y-2">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 font-medium">
            Improvement
          </p>
          <h1 className="text-4xl font-light text-white tracking-tight">
            Feedback
          </h1>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          {survey ? (
            <SurveyForm survey={survey} eventSlug={eventSlug} />
          ) : (
            <div className="glass rounded-[40px] p-20 text-center space-y-4 border-dashed border-white/5 opacity-40">
              <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
                Survey is currently inactive
              </p>
            </div>
          )}
        </div>
      </main>

      <EventNav eventSlug={eventSlug} />
    </div>
  );
}
