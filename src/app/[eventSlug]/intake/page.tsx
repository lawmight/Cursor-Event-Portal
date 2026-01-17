import { notFound, redirect } from "next/navigation";
import { getEventBySlug } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { getIntakeStatus } from "@/lib/actions/intake";
import { IntakeForm } from "@/components/forms/IntakeForm";

interface IntakePageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function IntakePage({ params }: IntakePageProps) {
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

  // Check if already completed intake
  const intakeStatus = await getIntakeStatus(event.id, session.userId);
  if (intakeStatus.completed) {
    redirect(`/${eventSlug}/agenda`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cursor-purple/5 via-white to-blue-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Quick Networking Setup
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Help us connect you with the right people today
          </p>
        </div>

        <IntakeForm eventId={event.id} eventSlug={eventSlug} />
      </div>
    </div>
  );
}
