import { getEventRegistrations, getQuestions, getSurveyResponses, getPublishedSurvey } from "@/lib/supabase/queries";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataManagementClient } from "../../_clients/[adminCode]/data/DataManagementClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export default async function DataManagementPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);

  const [registrations, questions, survey] = await Promise.all([
    getEventRegistrations(event.id),
    getQuestions(event.id),
    getPublishedSurvey(event.id),
  ]);

  let surveyResponses: any[] = [];
  if (survey) surveyResponses = await getSurveyResponses(survey.id);

  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/2 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/1 rounded-full blur-[150px] pointer-events-none" />
      <AdminHeader adminCode={adminCode} subtitle="Data Management" />
      <main className="max-w-4xl mx-auto px-6 py-8 w-full z-10 flex-1 space-y-12">
        <DataManagementClient event={event} eventSlug={event.slug} adminCode={adminCode} registrations={registrations} questions={questions} survey={survey} surveyResponses={surveyResponses} />
      </main>
      <footer className="py-12 px-6 border-t border-white/3 flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Data Management</p>
      </footer>
    </div>
  );
}
