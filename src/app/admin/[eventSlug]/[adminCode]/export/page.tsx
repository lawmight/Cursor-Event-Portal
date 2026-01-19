import { notFound, redirect } from "next/navigation";
import { getEventRegistrations, getQuestions, getSurveyResponses, getPublishedSurvey } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ExportClient } from "../../../[eventSlug]/export/ExportClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface ExportPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function ExportPage({ params }: ExportPageProps) {
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

      <AdminHeader 
        eventSlug={eventSlug}
        adminCode={adminCode}
        subtitle="Data Extraction Protocol" 
      />

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
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Data Export</p>
        </div>
      </footer>
    </div>
  );
}
