import { AdminHeader } from "@/components/admin/AdminHeader";
import { HelpQueueAdmin } from "@/components/help/HelpQueueAdmin";
import { getHelpRequestsForAdmin } from "@/lib/supabase/queries";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminHelpPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminHelpPage({ params }: AdminHelpPageProps) {
  const { eventSlug, adminCode } = await params;
  const event = await validateAdminCode(eventSlug, adminCode);

  const requests = await getHelpRequestsForAdmin(event.id);

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      <AdminHeader
        eventSlug={eventSlug}
        adminCode={adminCode}
        subtitle="Help Queue"
      />

      <main className="z-10 flex-1">
        <HelpQueueAdmin
          initialRequests={requests}
          eventId={event.id}
          eventSlug={eventSlug}
          adminCode={adminCode}
        />
      </main>
    </div>
  );
}
