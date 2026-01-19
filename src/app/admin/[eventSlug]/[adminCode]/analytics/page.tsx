import { notFound, redirect } from "next/navigation";
import { getEventBySlug } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AnalyticsClient } from "./AnalyticsClient";
import { validateAdminCode } from "@/lib/utils/admin";
import {
  getCheckInCurve,
  getQAAnalytics,
  getPollParticipation,
  getIntakeAnalytics,
} from "@/lib/supabase/queries";

interface AnalyticsPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { eventSlug, adminCode } = await params;

  // Validate admin code and get event
  const event = await validateAdminCode(eventSlug, adminCode);

  // Check if admin
  const session = await getSession();
  if (!session) {
    redirect(`/${eventSlug}`);
  }

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    redirect(`/${eventSlug}/agenda`);
  }

  // Fetch all analytics data
  const [checkInCurve, qaAnalytics, pollParticipation, intakeAnalytics] = await Promise.all([
    getCheckInCurve(event.id),
    getQAAnalytics(event.id),
    getPollParticipation(event.id),
    getIntakeAnalytics(event.id),
  ]);

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      <AdminHeader 
        eventSlug={eventSlug}
        adminCode={adminCode}
        subtitle="Analytics & Insights" 
      />

      <main className="max-w-6xl mx-auto px-6 py-8 w-full z-10 flex-1 space-y-12">
        <AnalyticsClient
          event={event}
          checkInCurve={checkInCurve}
          qaAnalytics={qaAnalytics}
          pollParticipation={pollParticipation}
          intakeAnalytics={intakeAnalytics}
        />
      </main>

      <footer className="py-12 px-6 border-t border-white/[0.03] flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Analytics Dashboard</p>
        </div>
      </footer>
    </div>
  );
}
