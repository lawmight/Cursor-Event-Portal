import { notFound, redirect } from "next/navigation";
import { getAllSurveys } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { SurveysAdminClient } from "../../../[eventSlug]/surveys/SurveysAdminClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminSurveysPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminSurveysPage({ params }: AdminSurveysPageProps) {
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

  const surveys = await getAllSurveys(event.id);

  return (
    <SurveysAdminClient
      event={event}
      eventSlug={eventSlug}
      adminCode={adminCode}
      initialSurveys={surveys}
    />
  );
}
