import { getAllSurveys } from "@/lib/supabase/queries";
import { SurveysAdminClient } from "../../_clients/surveys/SurveysAdminClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export default async function AdminSurveysPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);
  const surveys = await getAllSurveys(event.id);
  return <SurveysAdminClient event={event} eventSlug={event.slug} adminCode={adminCode} initialSurveys={surveys} />;
}
