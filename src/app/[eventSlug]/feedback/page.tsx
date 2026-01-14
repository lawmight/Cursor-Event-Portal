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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <EventHeader event={event} announcement={latestAnnouncement} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Feedback
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Help us improve future events
          </p>
        </div>

        {survey ? (
          <SurveyForm survey={survey} eventSlug={eventSlug} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Survey Coming Soon
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                The feedback survey will be available after the event. Check back later!
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <EventNav eventSlug={eventSlug} />
    </div>
  );
}
