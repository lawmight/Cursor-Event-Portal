import { AdminHeader } from "@/components/admin/AdminHeader";
import { AnalyticsClient } from "../../_clients/[adminCode]/analytics/AnalyticsClient";
import { getEventForAdmin } from "@/lib/utils/admin";
import { getCheckInCurve, getQAAnalytics, getPollParticipation, getIntakeAnalytics, getSeriesAttendanceData } from "@/lib/supabase/queries";

export default async function AnalyticsPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);

  const [checkInCurve, qaAnalytics, pollParticipation, intakeAnalytics] = await Promise.all([
    getCheckInCurve(event.id),
    getQAAnalytics(event.id),
    getPollParticipation(event.id),
    getIntakeAnalytics(event.id),
  ]);

  const seriesAttendanceData = event.series_id ? await getSeriesAttendanceData(event.series_id) : null;

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />
      <AdminHeader adminCode={adminCode} subtitle="Analytics & Insights" />
      <main className="max-w-6xl mx-auto px-6 py-8 w-full z-10 flex-1 space-y-12">
        <AnalyticsClient event={event} checkInCurve={checkInCurve} qaAnalytics={qaAnalytics} pollParticipation={pollParticipation} intakeAnalytics={intakeAnalytics} seriesAttendanceData={seriesAttendanceData || undefined} />
      </main>
      <footer className="py-12 px-6 border-t border-white/[0.03] flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Analytics Dashboard</p>
      </footer>
    </div>
  );
}
