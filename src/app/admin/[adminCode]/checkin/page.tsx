import { createServiceClient } from "@/lib/supabase/server";
import {
  getAgendaItems,
  getEventIntakes,
  getEventRegistrations,
  getSuggestedGroups,
  getTableQRCodes,
} from "@/lib/supabase/queries";
import { AttendanceHubClient } from "@/app/admin/_clients/[adminCode]/checkin/AttendanceHubClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminCheckInPageProps {
  params: Promise<{ adminCode: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminCheckInPage({ params, searchParams }: AdminCheckInPageProps) {
  const { adminCode } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "seating" ? "seating" : "checkin";

  const event = await getEventForAdmin(adminCode);

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  let stats: { registered: number; checkedIn: number };
  let registrations: Awaited<ReturnType<typeof getEventRegistrations>>;
  let agendaItems: Awaited<ReturnType<typeof getAgendaItems>>;
  let intakes: Awaited<ReturnType<typeof getEventIntakes>>;
  let groups: Awaited<ReturnType<typeof getSuggestedGroups>>;
  let qrCodes: Awaited<ReturnType<typeof getTableQRCodes>>;

  if (useMock) {
    const [regs, agenda, intakesData, groupsData, qrData] = await Promise.all([
      getEventRegistrations(event.id),
      getAgendaItems(event.id),
      getEventIntakes(event.id),
      getSuggestedGroups(event.id),
      getTableQRCodes(event.id),
    ]);
    registrations = regs;
    agendaItems = agenda;
    intakes = intakesData;
    groups = groupsData;
    qrCodes = qrData;
    stats = {
      registered: regs.length,
      checkedIn: regs.filter((r) => r.checked_in_at).length,
    };
  } else {
    const supabase = await createServiceClient();
    const [registrationsResult, checkedInResult, registrationsData, agendaItemsResult, intakesData, groupsData, qrData] =
      await Promise.all([
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id),
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id).not("checked_in_at", "is", null),
        supabase
          .from("registrations")
          .select("*, user:users(*, intakes:attendee_intakes(*))")
          .eq("event_id", event.id)
          .eq("user.intakes.event_id", event.id)
          .order("created_at", { ascending: false }),
        supabase.from("agenda_items").select("*").eq("event_id", event.id).order("sort_order", { ascending: true }),
        getEventIntakes(event.id),
        getSuggestedGroups(event.id),
        getTableQRCodes(event.id),
      ]);
    stats = { registered: registrationsResult.count || 0, checkedIn: checkedInResult.count || 0 };
    registrations = (registrationsData.data || []) as Awaited<ReturnType<typeof getEventRegistrations>>;
    agendaItems = (agendaItemsResult.data || []) as Awaited<ReturnType<typeof getAgendaItems>>;
    intakes = intakesData;
    groups = groupsData;
    qrCodes = qrData;
  }

  return (
    <AttendanceHubClient
      event={event}
      eventSlug={event.slug}
      adminCode={adminCode}
      initialRegistrations={registrations}
      stats={stats}
      initialAgendaItems={agendaItems}
      intakes={intakes}
      groups={groups}
      qrCodes={qrCodes}
      activeTab={activeTab}
    />
  );
}
