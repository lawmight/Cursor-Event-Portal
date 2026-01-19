import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsClient } from "./AnnouncementsClient";

interface AnnouncementsPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AnnouncementsPage({ params }: AnnouncementsPageProps) {
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

  const announcements = await getAnnouncements(event.id);

  return <AnnouncementsClient event={event} eventSlug={eventSlug} adminCode={undefined} initialAnnouncements={announcements} />;
}
