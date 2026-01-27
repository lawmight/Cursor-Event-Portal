import { getAllPolls } from "@/lib/supabase/queries";
import { PollsAdminClient } from "../../../[eventSlug]/polls/PollsAdminClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminPollsPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminPollsPage({ params }: AdminPollsPageProps) {
  const { eventSlug, adminCode } = await params;

  // Validate admin code and get event (this is sufficient for admin access)
  const event = await validateAdminCode(eventSlug, adminCode);

  // Deactivate expired polls before loading
  const { deactivateExpiredPolls } = await import("@/lib/actions/polls");
  await deactivateExpiredPolls(event.id, eventSlug);

  const polls = await getAllPolls(event.id);

  return (
    <PollsAdminClient
      event={event}
      eventSlug={eventSlug}
      adminCode={adminCode}
      initialPolls={polls}
    />
  );
}
