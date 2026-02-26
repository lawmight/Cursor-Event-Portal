import { getQuestionsForAdmin } from "@/lib/supabase/queries";
import { AdminQAClient } from "../../_clients/qa/AdminQAClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export default async function AdminQAPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);
  const questions = await getQuestionsForAdmin(event.id, "trending", true);
  return <AdminQAClient event={event} eventSlug={event.slug} adminCode={adminCode} initialQuestions={questions} sortBy="trending" statusFilter="all" />;
}
