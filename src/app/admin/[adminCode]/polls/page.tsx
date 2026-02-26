import { getAllPolls } from "@/lib/supabase/queries";
import { PollsAdminClient } from "../../_clients/polls/PollsAdminClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export default async function AdminPollsPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);
  const polls = await getAllPolls(event.id);
  return <PollsAdminClient event={event} eventSlug={event.slug} adminCode={adminCode} initialPolls={polls} />;
}
