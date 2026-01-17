import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getAgendaItems } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { AgendaAdminClient } from "./AgendaAdminClient";

interface AdminAgendaPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminAgendaPage({ params }: AdminAgendaPageProps) {
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

  const items = await getAgendaItems(event.id);

  return <AgendaAdminClient event={event} eventSlug={eventSlug} initialItems={items} />;
}
