import { notFound, redirect } from "next/navigation";
import { getSlideDeck } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { SlideDeckAdminClient } from "../../../[eventSlug]/slides/SlideDeckAdminClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminSlideDeckPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminSlideDeckPage({ params }: AdminSlideDeckPageProps) {
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

  const slideDeck = await getSlideDeck(event.id);

  return <SlideDeckAdminClient event={event} eventSlug={eventSlug} adminCode={adminCode} initialDeck={slideDeck} />;
}
