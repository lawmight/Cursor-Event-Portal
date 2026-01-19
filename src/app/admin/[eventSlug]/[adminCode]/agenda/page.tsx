import { notFound, redirect } from "next/navigation";
import { getAgendaItems } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { AgendaAdminClient } from "../../../[eventSlug]/agenda/AgendaAdminClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminAgendaPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminAgendaPage({ params }: AdminAgendaPageProps) {
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

  const items = await getAgendaItems(event.id);

  return <AgendaAdminClient event={event} eventSlug={eventSlug} adminCode={adminCode} initialItems={items} />;
}
