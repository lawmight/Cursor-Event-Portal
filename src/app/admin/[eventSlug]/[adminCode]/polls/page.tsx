import { notFound, redirect } from "next/navigation";
import { getAllPolls } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { PollsAdminClient } from "../../../[eventSlug]/polls/PollsAdminClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminPollsPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminPollsPage({ params }: AdminPollsPageProps) {
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
