import { getAgendaItems } from "@/lib/supabase/queries";
import { AgendaAdminClient } from "../../../[eventSlug]/agenda/AgendaAdminClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminAgendaPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminAgendaPage({ params }: AdminAgendaPageProps) {
  const { eventSlug, adminCode } = await params;

  // Validate admin code and get event (this is sufficient for admin access)
  const event = await validateAdminCode(eventSlug, adminCode);

  const items = await getAgendaItems(event.id);

  return <AgendaAdminClient event={event} eventSlug={eventSlug} adminCode={adminCode} initialItems={items} />;
}
