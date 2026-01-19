import { getEventBySlug } from "@/lib/supabase/queries";
import { notFound } from "next/navigation";

/**
 * Validates that the provided adminCode matches the event's admin_code
 * Returns the event if valid, otherwise calls notFound()
 */
export async function validateAdminCode(
  eventSlug: string,
  adminCode: string
) {
  const event = await getEventBySlug(eventSlug);
  
  if (!event) {
    notFound();
  }
  
  if (event.admin_code !== adminCode) {
    notFound();
  }
  
  return event;
}
