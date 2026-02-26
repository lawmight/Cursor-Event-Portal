import { createServiceClient } from "@/lib/supabase/server";
import { CheckInClient } from "@/app/staff/[eventSlug]/checkin/CheckInClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export const revalidate = 0;

export default async function AdminCheckInPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);
  const supabase = await createServiceClient();

  const [registrationsResult, checkedInResult, registrationsData, agendaItemsResult] = await Promise.all([
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id).not("checked_in_at", "is", null),
    supabase.from("registrations").select("*, user:users(*, intakes:attendee_intakes(*))").eq("event_id", event.id).eq("user.intakes.event_id", event.id).order("created_at", { ascending: false }),
    supabase.from("agenda_items").select("*").eq("event_id", event.id).order("sort_order", { ascending: true }),
  ]);

  const stats = { registered: registrationsResult.count || 0, checkedIn: checkedInResult.count || 0 };
  const registrations = registrationsData.data || [];
  const agendaItems = agendaItemsResult.data || [];

  return (
    <CheckInClient
      event={event}
      eventSlug={event.slug}
      adminCode={adminCode}
      initialRegistrations={registrations}
      stats={stats}
      initialAgendaItems={agendaItems}
    />
  );
}
