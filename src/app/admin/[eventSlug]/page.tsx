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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-gradient-to-br from-cursor-purple via-cursor-purple-dark to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold">
              C
            </div>
            <div>
              <h1 className="text-2xl font-bold">{event.name}</h1>
              <p className="text-white/80 text-sm">Admin Dashboard</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Users className="w-5 h-5 text-white/60 mb-2" />
              <p className="text-3xl font-bold">{stats.registered}</p>
              <p className="text-sm text-white/70">Registered</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <UserCheck className="w-5 h-5 text-white/60 mb-2" />
              <p className="text-3xl font-bold">{stats.checkedIn}</p>
              <p className="text-sm text-white/70">Checked In</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <MessageCircle className="w-5 h-5 text-white/60 mb-2" />
              <p className="text-3xl font-bold">{openQuestions}</p>
              <p className="text-sm text-white/70">Open Questions</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <ClipboardCheck className="w-5 h-5 text-white/60 mb-2" />
              <p className="text-3xl font-bold">{surveyResponses}</p>
              <p className="text-sm text-white/70">Survey Responses</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 -mt-4 space-y-6">
        {/* Capacity Progress */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Event Capacity
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.registered} registered · {stats.checkedIn} checked in
                </p>
              </div>
              <span className="text-2xl font-bold text-cursor-purple">
                {Math.round((stats.registered / event.capacity) * 100)}%
              </span>
            </div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full flex">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(stats.checkedIn / event.capacity) * 100}%`,
                  }}
                />
                <div
                  className="bg-cursor-purple/50 transition-all duration-500"
                  style={{
                    width: `${((stats.registered - stats.checkedIn) / event.capacity) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                Checked in
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cursor-purple/50" />
                Registered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                Available ({event.capacity - stats.registered})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href={`/staff/${eventSlug}/checkin`}>
            <Card className="h-full hover:border-cursor-purple transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Check-In
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage attendee check-ins
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cursor-purple group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${eventSlug}/qa`}>
            <Card className="h-full hover:border-cursor-purple transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Q&A Moderation
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {openQuestions} questions need attention
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cursor-purple group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/${eventSlug}/announcements`}>
            <Card className="h-full hover:border-cursor-purple transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Megaphone className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Announcements
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Broadcast to all attendees
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cursor-purple group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/${eventSlug}/export`}>
            <Card className="h-full hover:border-cursor-purple transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Export Data
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Download attendees, Q&A, surveys
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cursor-purple group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/admin/${eventSlug}/registrations/import`}>
            <Card className="h-full hover:border-cursor-purple transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Import Attendees
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upload Luma CSV to add registrations
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cursor-purple group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* View Event */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  View Live Event
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  See the event as attendees see it
                </p>
              </div>
              <Link href={`/${eventSlug}/agenda`}>
                <Button variant="outline">
                  Open Event Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
