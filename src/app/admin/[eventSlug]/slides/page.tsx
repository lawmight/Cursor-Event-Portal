import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getSlideDeck } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { SlideDeckAdminClient } from "./SlideDeckAdminClient";

interface AdminSlideDeckPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminSlideDeckPage({ params }: AdminSlideDeckPageProps) {
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

  // Redirect to new admin URL format with adminCode
  if (event.admin_code) {
    redirect(`/admin/${eventSlug}/${event.admin_code}/slides`);
  }

  const slideDeck = await getSlideDeck(event.id);

  return <SlideDeckAdminClient event={event} eventSlug={eventSlug} initialDeck={slideDeck} />;
}

