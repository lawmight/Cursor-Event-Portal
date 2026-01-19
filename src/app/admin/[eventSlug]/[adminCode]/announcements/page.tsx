import { notFound, redirect } from "next/navigation";
import { getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsClient } from "../../../[eventSlug]/announcements/AnnouncementsClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AnnouncementsPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AnnouncementsPage({ params }: AnnouncementsPageProps) {
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

  const announcements = await getAnnouncements(event.id);

  return <AnnouncementsClient event={event} eventSlug={eventSlug} adminCode={adminCode} initialAnnouncements={announcements} />;
}
