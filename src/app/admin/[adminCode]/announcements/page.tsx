import { getAnnouncements } from "@/lib/supabase/queries";
import { AnnouncementsClient } from "../../_clients/announcements/AnnouncementsClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export default async function AnnouncementsPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);
  const announcements = await getAnnouncements(event.id);
  return <AnnouncementsClient event={event} eventSlug={event.slug} adminCode={adminCode} initialAnnouncements={announcements} />;
}
