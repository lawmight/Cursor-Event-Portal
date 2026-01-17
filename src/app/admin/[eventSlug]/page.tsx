import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getEventStats, getQuestions, getSurveyResponses, getPublishedSurvey } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  UserCheck,
  MessageCircle,
  ClipboardCheck,
  ArrowRight,
  Settings,
  BarChart3,
  Download,
  Megaphone,
  Upload,
  Sparkles,
} from "lucide-react";

interface AdminDashboardProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminDashboard({ params }: AdminDashboardProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

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

  const [stats, questions] = await Promise.all([
    getEventStats(event.id),
    getQuestions(event.id),
  ]);

  const openQuestions = questions.filter((q) => q.status === "open").length;
  const survey = await getPublishedSurvey(event.id);
  let surveyResponses = 0;
  if (survey) {
    const responses = await getSurveyResponses(survey.id);
    surveyResponses = responses.length;
  }

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="z-10 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              C
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-light tracking-tight">{event.name}</h1>
              <p className="text-[12px] uppercase tracking-[0.4em] text-gray-700 font-medium">Admin Intelligence</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass rounded-3xl p-6 border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
              <Users className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors mb-3" />
              <p className="text-4xl font-light tracking-tight tabular-nums">{stats.registered}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium mt-1">Registered</p>
            </div>
            <div className="glass rounded-3xl p-6 border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
              <UserCheck className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors mb-3" />
              <p className="text-4xl font-light tracking-tight tabular-nums">{stats.checkedIn}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium mt-1">Checked In</p>
            </div>
            <div className="glass rounded-3xl p-6 border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
              <MessageCircle className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors mb-3" />
              <p className="text-4xl font-light tracking-tight tabular-nums">{openQuestions}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium mt-1">Open Q&A</p>
            </div>
            <div className="glass rounded-3xl p-6 border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
              <ClipboardCheck className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors mb-3" />
              <p className="text-4xl font-light tracking-tight tabular-nums">{surveyResponses}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium mt-1">Surveys</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 w-full space-y-8 z-10 flex-1">
        {/* Capacity Progress */}
        <div className="glass rounded-[40px] p-10 border-white/[0.03]">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <h3 className="text-[11px] uppercase tracking-[0.4em] text-gray-700 font-medium">
                Resource Allocation
              </h3>
              <p className="text-2xl font-light tracking-tight text-white/90">
                {stats.registered} registered · {stats.checkedIn} checked in
              </p>
            </div>
            <div className="text-4xl font-light tracking-tight text-white/20 tabular-nums">
              {Math.round((stats.registered / event.capacity) * 100)}%
            </div>
          </div>
          <div className="h-[2px] bg-white/[0.03] rounded-full overflow-hidden">
            <div className="h-full flex shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <div
                className="bg-white transition-all duration-1000"
                style={{
                  width: `${(stats.checkedIn / event.capacity) * 100}%`,
                }}
              />
              <div
                className="bg-white/20 transition-all duration-1000"
                style={{
                  width: `${((stats.registered - stats.checkedIn) / event.capacity) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex gap-8 mt-6">
            <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              Checked
            </span>
            <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              Pending
            </span>
            <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white/[0.03]" />
              Capacity ({event.capacity - stats.registered} left)
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href={`/staff/${eventSlug}/checkin`}>
            <div className="glass rounded-[40px] p-8 border-white/[0.02] hover:bg-white/[0.02] transition-all group cursor-pointer relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
                    <UserCheck className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-light tracking-tight text-white/90">
                      Check-In
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                      Manage Attendance
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          <Link href={`/${eventSlug}/qa`}>
            <div className="glass rounded-[40px] p-8 border-white/[0.02] hover:bg-white/[0.02] transition-all group cursor-pointer relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
                    <MessageCircle className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-light tracking-tight text-white/90">
                      Q&A
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                      {openQuestions} Unresolved
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          <Link href={`/admin/${eventSlug}/announcements`}>
            <div className="glass rounded-[40px] p-8 border-white/[0.02] hover:bg-white/[0.02] transition-all group cursor-pointer relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
                    <Megaphone className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-light tracking-tight text-white/90">
                      Bulletin
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                      Broadcast Signal
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          <Link href={`/admin/${eventSlug}/export`}>
            <div className="glass rounded-[40px] p-8 border-white/[0.02] hover:bg-white/[0.02] transition-all group cursor-pointer relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
                    <Download className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-light tracking-tight text-white/90">
                      Analytics
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                      Extraction Data
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          <Link href={`/admin/${eventSlug}/registrations/import`}>
            <div className="glass rounded-[40px] p-8 border-white/[0.02] hover:bg-white/[0.02] transition-all group cursor-pointer relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
                    <Upload className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-light tracking-tight text-white/90">
                      Import
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                      Luma Sync
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          <Link href={`/admin/${eventSlug}/groups`}>
            <div className="glass rounded-[40px] p-8 border-white/[0.02] hover:bg-white/[0.02] transition-all group cursor-pointer relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
                    <Sparkles className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-light tracking-tight text-white/90">
                      Intelligence
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                      Networking Engine
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </div>

        {/* View Event */}
        <Link href={`/${eventSlug}/agenda`}>
          <div className="glass rounded-[40px] p-10 border-white/[0.03] hover:bg-white/[0.02] transition-all group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-2xl font-light tracking-tight text-white/90">
                  Exit to Portal
                </h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                  View Attendee Perspective
                </p>
              </div>
              <div className="px-8 py-3 bg-white text-black rounded-full font-medium text-sm group-hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Launch Portal
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      </main>

      <footer className="py-12 px-6 border-t border-white/[0.03] flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-800 font-medium">Pop-Up System / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-800 font-medium">Control Center</p>
          <span className="text-[10px] font-medium text-white/40 px-5 py-2 bg-white/[0.02] rounded-full border border-white/[0.05]">Active Session</span>
        </div>
      </footer>
    </div>
  );
}
