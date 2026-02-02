import { validateAdminCode } from "@/lib/utils/admin";
import { getAllCompetitions } from "@/lib/supabase/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CompetitionsAdminClient } from "@/components/admin/CompetitionsAdminClient";

interface AdminCompetitionsPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export const revalidate = 0;

export default async function AdminCompetitionsPage({ params }: AdminCompetitionsPageProps) {
  const { eventSlug, adminCode } = await params;
  const event = await validateAdminCode(eventSlug, adminCode);

  const competitions = await getAllCompetitions(event.id);

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      <AdminHeader
        eventSlug={eventSlug}
        adminCode={adminCode}
        subtitle="Competitions"
      />

      <main className="max-w-4xl mx-auto px-6 py-8 pb-16 w-full space-y-8 z-10 flex-1">
        <CompetitionsAdminClient
          eventId={event.id}
          eventSlug={eventSlug}
          adminCode={adminCode}
          initialCompetitions={competitions}
        />
      </main>
    </div>
  );
}
