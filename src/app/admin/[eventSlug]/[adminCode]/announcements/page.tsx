import { getAnnouncements } from "@/lib/supabase/queries";
import { AnnouncementsClient } from "../../../[eventSlug]/announcements/AnnouncementsClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AnnouncementsPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AnnouncementsPage({ params }: AnnouncementsPageProps) {
  const { eventSlug, adminCode } = await params;

  // Validate admin code and get event (this is sufficient for admin access)
  const event = await validateAdminCode(eventSlug, adminCode);

  const announcements = await getAnnouncements(event.id);

  return <AnnouncementsClient event={event} eventSlug={eventSlug} adminCode={adminCode} initialAnnouncements={announcements} />;
}
