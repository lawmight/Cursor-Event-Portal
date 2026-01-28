import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getEventBySlug, getPublishedSurvey } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { SurveyForm } from "@/components/survey/SurveyForm";

interface FeedbackPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  const session = await getSession();
  if (!session || session.eventId !== event.id) {
    redirect(`/${eventSlug}`);
  }

  const survey = await getPublishedSurvey(event.id);

  return (
    <div className="min-h-screen bg-black-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-xl z-10 space-y-12">
        <div className="text-center space-y-4 floating">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-3xl items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-4 overflow-hidden">
            <Image
              src="/cursor-calgary.avif"
              alt="Cursor Calgary"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-700 font-medium">
              Event Feedback
            </p>
            <h1 className="text-4xl font-light text-white tracking-tight text-shadow-glow">
              Share Your Experience
            </h1>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed pt-2">
              Your feedback helps improve future events. This takes less than a minute.
            </p>
          </div>
        </div>

        {!survey ? (
          <div className="glass rounded-[40px] p-10 text-center space-y-4 animate-slide-up">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-medium">
              No survey available
            </p>
            <p className="text-sm text-gray-500">
              A feedback survey hasn&apos;t been published yet. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <SurveyForm survey={survey} eventSlug={eventSlug} />
          </div>
        )}
      </div>
    </div>
  );
}
