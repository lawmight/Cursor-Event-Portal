import { getAllSurveys } from "@/lib/supabase/queries";
import { SurveysAdminClient } from "../../../[eventSlug]/surveys/SurveysAdminClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminSurveysPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminSurveysPage({ params }: AdminSurveysPageProps) {
  const { eventSlug, adminCode } = await params;

  // Validate admin code and get event (this is sufficient for admin access)
  const event = await validateAdminCode(eventSlug, adminCode);

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
