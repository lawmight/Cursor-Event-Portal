import { AdminHeader } from "@/components/admin/AdminHeader";
import { getEventRegistrations } from "@/lib/supabase/queries";
import { ImportRegistrationsClient } from "@/components/admin/ImportRegistrationsClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export default async function ImportRegistrationsPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);
  const existing = await getEventRegistrations(event.id);

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/2 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/1 rounded-full blur-[150px] pointer-events-none" />
      <AdminHeader adminCode={adminCode} subtitle="Luma Integration Unit" />
      <main className="max-w-4xl mx-auto px-6 py-8 w-full z-10 flex-1">
        <ImportRegistrationsClient
          eventId={event.id}
          eventSlug={event.slug}
          existingEmails={existing.map((r) => r.user?.email?.toLowerCase()).filter(Boolean) as string[]}
          adminCode={adminCode}
        />
      </main>
      <footer className="py-12 px-6 border-t border-white/3 flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Import</p>
      </footer>
    </div>
  );
}
