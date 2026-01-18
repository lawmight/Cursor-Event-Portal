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
