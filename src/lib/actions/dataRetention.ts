"use server";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Manually trigger cleanup of intake data for events past their retention period
 * This can be called from admin UI or scheduled tasks
 */
export async function cleanupExpiredIntakeData() {
  const supabase = await createServiceClient();
  const now = new Date();

  // Get all events that have ended
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, end_time, data_retention_days, name")
    .not("end_time", "is", null);

  if (eventsError) {
    console.error("[cleanupExpiredIntakeData] Error fetching events:", eventsError);
    return { error: "Failed to fetch events" };
  }

  if (!events || events.length === 0) {
    return { success: true, deleted: 0, message: "No events to process" };
  }

  let totalDeleted = 0;
  const results: Array<{ eventName: string; eventId: string; deleted: number }> = [];

  for (const event of events) {
    try {
      const endTime = new Date(event.end_time);
      const retentionDays = event.data_retention_days || 60; // Default to 60 days
      const cutoffDate = new Date(endTime);
      cutoffDate.setDate(cutoffDate.getDate() + retentionDays);

      // Only delete if retention period has passed
      if (now < cutoffDate) {
        continue;
      }

      // Delete intake data for this event
      const { error: deleteError, count } = await supabase
        .from("attendee_intakes")
        .delete()
        .eq("event_id", event.id)
        .select("*", { count: "exact", head: false });

      if (deleteError) {
        console.error(`[cleanupExpiredIntakeData] Error deleting intakes for event ${event.id}:`, deleteError);
      } else {
        const deletedCount = count || 0;
        totalDeleted += deletedCount;
        results.push({
          eventName: event.name,
          eventId: event.id,
          deleted: deletedCount,
        });
        console.log(`[cleanupExpiredIntakeData] Deleted ${deletedCount} intake records for event ${event.name} (${event.id})`);
      }
    } catch (error) {
      console.error(`[cleanupExpiredIntakeData] Exception processing event ${event.id}:`, error);
    }
  }

  return {
    success: true,
    totalDeleted,
    results,
    message: `Cleaned up ${totalDeleted} intake records from ${results.length} events`,
  };
}
