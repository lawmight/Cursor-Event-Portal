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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href={`/admin/${eventSlug}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            Export Data
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {event.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Download event data in various formats
          </p>
        </div>

        <ExportClient
          event={event}
          registrations={registrations}
          questions={questions}
          survey={survey}
          surveyResponses={surveyResponses}
        />
      </main>
    </div>
  );
}
