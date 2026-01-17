import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getAllSurveys } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { SurveysAdminClient } from "./SurveysAdminClient";

interface AdminSurveysPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminSurveysPage({ params }: AdminSurveysPageProps) {
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

  const surveys = await getAllSurveys(event.id);

  return (
    <SurveysAdminClient
      event={event}
      eventSlug={eventSlug}
      initialSurveys={surveys}
    />
  );
}
