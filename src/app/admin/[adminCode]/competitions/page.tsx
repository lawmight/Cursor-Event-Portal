import { getAllCompetitions } from "@/lib/supabase/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CompetitionsAdminClient } from "@/components/admin/CompetitionsAdminClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export const revalidate = 0;

export default async function AdminCompetitionsPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);
  const competitions = await getAllCompetitions(event.id);
  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/1 rounded-full blur-[150px] pointer-events-none" />
      <AdminHeader adminCode={adminCode} subtitle="Competitions" />
      <main className="max-w-4xl mx-auto px-6 py-8 pb-16 w-full space-y-8 z-10 flex-1">
        <CompetitionsAdminClient eventId={event.id} eventSlug={event.slug} adminCode={adminCode} initialCompetitions={competitions} />
      </main>
    </div>
  );
}
