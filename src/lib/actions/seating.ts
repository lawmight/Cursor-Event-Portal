"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";

export async function toggleSeatLockout(eventId: string, active: boolean, eventSlug: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const supabase = await createServiceClient();

  // Verify admin role
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("events")
    .update({ seat_lockout_active: active })
    .eq("id", eventId);

  if (error) {
    console.error("[toggleSeatLockout] Error:", error);
    return { error: "Failed to update lockout status" };
  }

  revalidatePath(`/admin/${eventSlug}`);
  revalidatePath(`/${eventSlug}/agenda`);
  return { success: true };
}

export async function getUserTableAssignment(eventId: string, userId: string) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("suggested_group_members")
    .select(`
      group:suggested_groups(
        id,
        name,
        table_number,
        status,
        event_id
      )
    `)
    .eq("user_id", userId)
    .single();

  if (error || !data?.group) {
    return null;
  }

  const group = data.group as any;
  
  // Only return assignment if in approved group for this event with table number
  if (group.event_id === eventId && group.status === "approved" && group.table_number) {
    return {
      tableNumber: group.table_number,
      groupName: group.name,
    };
  }

  return null;
}

export async function simulateEventStart(eventId: string, eventSlug: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const supabase = await createServiceClient();

  // Verify admin role
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  // Deactivate lockout to simulate event start
  const { error } = await supabase
    .from("events")
    .update({ seat_lockout_active: false })
    .eq("id", eventId);

  if (error) {
    console.error("[simulateEventStart] Error:", error);
    return { error: "Failed to simulate event start" };
  }

  revalidatePath(`/admin/${eventSlug}`);
  revalidatePath(`/${eventSlug}/agenda`);
  revalidatePath(`/${eventSlug}/`);
  return { success: true };
}

// Auto-unlock at event start time (called on page load)
export async function checkAndUnlockAtStartTime(eventId: string, eventSlug: string) {
  const supabase = await createServiceClient();

  // Get event with start time
  const { data: event } = await supabase
    .from("events")
    .select("start_time, seat_lockout_active")
    .eq("id", eventId)
    .single();

  if (!event || !event.start_time) {
    return; // No start time set
  }

  // Check if event has started and lockout is still active
  const now = new Date();
  const startTime = new Date(event.start_time);

  if (now >= startTime && event.seat_lockout_active) {
    // Event has started, unlock
    await supabase
      .from("events")
      .update({ seat_lockout_active: false })
      .eq("id", eventId);
    
    revalidatePath(`/admin/${eventSlug}`);
    revalidatePath(`/${eventSlug}/agenda`);
    revalidatePath(`/${eventSlug}/`);
  }
}

