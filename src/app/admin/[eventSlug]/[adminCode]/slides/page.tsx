import { getSlideDeck } from "@/lib/supabase/queries";
import { SlideDeckAdminClient } from "../../../[eventSlug]/slides/SlideDeckAdminClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminSlideDeckPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminSlideDeckPage({ params }: AdminSlideDeckPageProps) {
  const { eventSlug, adminCode } = await params;

  // Validate admin code and get event (this is sufficient for admin access)
  const event = await validateAdminCode(eventSlug, adminCode);

  const slideDeck = await getSlideDeck(event.id);

  return <SlideDeckAdminClient event={event} eventSlug={eventSlug} adminCode={adminCode} initialDeck={slideDeck} />;
}
