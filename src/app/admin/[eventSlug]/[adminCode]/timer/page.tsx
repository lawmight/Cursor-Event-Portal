import { AdminHeader } from "@/components/admin/AdminHeader";
import { TimerAdmin } from "@/components/admin/TimerAdmin";
import { validateAdminCode } from "@/lib/utils/admin";

interface TimerPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function TimerPage({ params }: TimerPageProps) {
  const { eventSlug, adminCode } = await params;
  const event = await validateAdminCode(eventSlug, adminCode);

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      <AdminHeader
        eventSlug={eventSlug}
        adminCode={adminCode}
        subtitle="Timer Control"
      />

      <main className="z-10 flex-1">
        <TimerAdmin event={event} adminCode={adminCode} />
      </main>
    </div>
  );
}
