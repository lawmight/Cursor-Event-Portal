import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getEventBySlug } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { getIntakeStatus } from "@/lib/actions/intake";
import { getSurveyConsentStatus } from "@/lib/actions/consent";
import { createServiceClient } from "@/lib/supabase/server";
import { IntakeForm } from "@/components/forms/IntakeForm";
import { communityDisplayName, siteConfig } from "@/content/site.config";

interface IntakePageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  // Check if registered (session can be from check-in OR pre-event intake access)
  const session = await getSession();
  if (!session || session.eventId !== event.id) {
    redirect(`/${eventSlug}`);
  }

  // Check if already completed intake
  const intakeStatus = await getIntakeStatus(event.id, session.userId);
  if (intakeStatus.completed) {
    // If checked in, go to agenda; otherwise go back to main page
    const supabase = await createServiceClient();
    const { data: registration } = await supabase
      .from("registrations")
      .select("checked_in_at")
      .eq("event_id", event.id)
      .eq("user_id", session.userId)
      .single();
    
    if (registration?.checked_in_at) {
      redirect(`/${eventSlug}/agenda`);
    } else {
      redirect(`/${eventSlug}`);
    }
  }

  // Get consent status and user email
  const consentStatus = await getSurveyConsentStatus(event.id, session.userId);
  const supabase = await createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", session.userId)
    .single();

  return (
    <div className="min-h-screen bg-black-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/3 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/2 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md z-10 space-y-12">
        <div className="text-center space-y-4 floating">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-3xl items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-4 overflow-hidden">
            <Image
              src={siteConfig.brandImagePath}
              alt={communityDisplayName()}
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
              Share Your Goals for This Event!
            </h1>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed pt-2">
              Tell us what you&apos;re hoping to get out of this event. This is completely optional—you can skip and still access all features.
            </p>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <IntakeForm 
            eventId={event.id} 
            eventSlug={eventSlug}
            hasConsented={consentStatus.hasConsented}
            userEmail={user?.email || null}
            retentionDays={event.data_retention_days || 60}
          />
        </div>
      </div>
    </div>
  );
}
