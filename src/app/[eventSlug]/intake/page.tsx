import { notFound, redirect } from "next/navigation";
import Image from "next/image";
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
    <div className="min-h-screen bg-black-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md z-10 space-y-12">
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
              Welcome to the Portal
            </p>
            <h1 className="text-4xl font-light text-white tracking-tight text-shadow-glow">
              Share Your Signals
            </h1>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed pt-2">
              Help us enhance your networking experience by sharing what you're looking for and what you can offer. This is completely optional—you can skip and still access all features.
            </p>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <IntakeForm eventId={event.id} eventSlug={eventSlug} />
        </div>
      </div>
    </div>
  );
}
