import { getSlideDeck } from "@/lib/supabase/queries";
import { SlideDeckAdminClient } from "../../_clients/slides/SlideDeckAdminClient";
import { getEventForAdmin } from "@/lib/utils/admin";

export default async function AdminSlideDeckPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  const event = await getEventForAdmin(adminCode);
  const slideDeck = await getSlideDeck(event.id);
  return <SlideDeckAdminClient event={event} eventSlug={event.slug} adminCode={adminCode} initialDeck={slideDeck} />;
}
