import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getEventRegistrations, getQuestions, getSurveyResponses, getPublishedSurvey } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, FileText } from "lucide-react";
import { ExportClient } from "./ExportClient";

interface ExportPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function ExportPage({ params }: ExportPageProps) {
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

  const [registrations, questions, survey] = await Promise.all([
    getEventRegistrations(event.id),
    getQuestions(event.id),
    getPublishedSurvey(event.id),
  ]);

  let surveyResponses: any[] = [];
  if (survey) {
    surveyResponses = await getSurveyResponses(survey.id);
  }

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="z-10 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <Link href={`/admin/${eventSlug}`}>
              <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium flex items-center gap-2 group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back to Dashboard
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              E
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-light tracking-tight">{event.name}</h1>
              <p className="text-[12px] uppercase tracking-[0.4em] text-gray-700 font-medium">Data Extraction Protocol</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 w-full z-10 flex-1 space-y-12">
        <ExportClient
          event={event}
          registrations={registrations}
          questions={questions}
          survey={survey}
          surveyResponses={surveyResponses}
        />
      </main>

      <footer className="py-12 px-6 border-t border-white/[0.03] flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-800 font-medium">Pop-Up System / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-800 font-medium">Recovery Unit</p>
          <span className="text-[10px] font-medium text-white/40 px-5 py-2 bg-white/[0.02] rounded-full border border-white/[0.05]">Secure Stream</span>
        </div>
      </footer>
    </div>
  );
}
