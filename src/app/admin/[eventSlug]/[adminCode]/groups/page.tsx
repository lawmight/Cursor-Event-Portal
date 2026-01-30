import { getEventIntakes, getSuggestedGroups, getTableQRCodes } from "@/lib/supabase/queries";
import { SeatingManagementClient } from "@/components/admin/SeatingManagementClient";
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

      <main className="max-w-6xl mx-auto px-6 py-8 w-full z-10 flex-1">
        <SeatingManagementClient
          eventId={event.id}
          eventSlug={eventSlug}
          adminCode={adminCode}
          intakes={intakes}
          groups={groups}
          qrCodes={qrCodes}
        />
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
