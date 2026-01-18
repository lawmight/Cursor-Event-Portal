import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getAllPolls } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { PollsAdminClient } from "./PollsAdminClient";

interface AdminPollsPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminPollsPage({ params }: AdminPollsPageProps) {
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

  // Deactivate expired polls before loading
  const { deactivateExpiredPolls } = await import("@/lib/actions/polls");
  await deactivateExpiredPolls(event.id, eventSlug);

  const polls = await getAllPolls(event.id);

  return (
    <PollsAdminClient
      event={event}
      eventSlug={eventSlug}
      initialPolls={polls}
    />
  );
}
