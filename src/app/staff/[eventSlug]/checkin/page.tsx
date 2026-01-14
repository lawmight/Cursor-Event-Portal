import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getEventRegistrations, getEventStats } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { CheckInClient } from "./CheckInClient";

interface CheckInPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  // Check if staff/admin
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

  if (!user || !["staff", "admin"].includes(user.role)) {
    redirect(`/${eventSlug}/agenda`);
  }

  const [registrations, stats] = await Promise.all([
    getEventRegistrations(event.id),
    getEventStats(event.id),
  ]);

  return (
    <CheckInClient
      event={event}
      initialRegistrations={registrations}
      stats={stats}
    />
  );
}
