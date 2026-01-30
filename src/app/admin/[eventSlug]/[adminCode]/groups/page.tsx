import { getEventIntakes, getSuggestedGroups, getTableQRCodes } from "@/lib/supabase/queries";
import { GroupFormation } from "@/components/admin/GroupFormation";
import { QRCodeManager } from "@/components/admin/QRCodeManager";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { validateAdminCode } from "@/lib/utils/admin";

// Force dynamic rendering to always show fresh checked-in data
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminGroupsPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminGroupsPage({ params }: AdminGroupsPageProps) {
  const { eventSlug, adminCode } = await params;

  // Validate admin code and get event (this is sufficient for admin access)
  const event = await validateAdminCode(eventSlug, adminCode);

  const [intakes, groups, qrCodes] = await Promise.all([
    getEventIntakes(event.id),
    getSuggestedGroups(event.id),
    getTableQRCodes(event.id),
  ]);

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      <AdminHeader 
        eventSlug={eventSlug}
        adminCode={adminCode}
        subtitle="Seating" 
      />

      <main className="max-w-4xl mx-auto px-6 py-8 w-full z-10 flex-1">
        <div className="space-y-12">
          <QRCodeManager
            eventId={event.id}
            eventSlug={eventSlug}
            adminCode={adminCode}
            qrCodes={qrCodes}
          />
          <GroupFormation
            eventId={event.id}
            eventSlug={eventSlug}
            adminCode={adminCode}
            intakes={intakes}
            groups={groups}
          />
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-white/[0.03] flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Seating</p>
        </div>
      </footer>
    </div>
  );
}
