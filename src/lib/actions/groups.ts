"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";
import { getEventIntakes } from "@/lib/supabase/queries";
import type { GroupStatus } from "@/types";

export async function generateGroups(eventId: string, eventSlug: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  // Verify admin role
  const supabase = await createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  // Get all intakes
  const intakes = await getEventIntakes(eventId);
  if (intakes.length < 2) {
    return { error: "Need at least 2 intake responses to form groups" };
  }

  // Call LLM for matching
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/ai/match-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, intakes }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.error || "Failed to generate group suggestions" };
  }

  const { groups } = await response.json();

  if (!groups || !Array.isArray(groups)) {
    return { error: "Invalid response from AI" };
  }

  // Clear existing pending groups for this event
  await supabase
    .from("suggested_groups")
    .delete()
    .eq("event_id", eventId)
    .eq("status", "pending");

  // Store suggested groups
  for (const group of groups) {
    const { data: newGroup, error: groupError } = await supabase
      .from("suggested_groups")
      .insert({
        event_id: eventId,
        name: group.name,
        description: group.description,
        status: "pending",
      })
      .select("id")
      .single();

    if (groupError || !newGroup) continue;

    // Insert group members
    const members = group.memberIds.map((userId: string) => ({
      group_id: newGroup.id,
      user_id: userId,
      match_reason: group.matchReasons?.[userId] || null,
    }));

    await supabase.from("suggested_group_members").insert(members);
  }

  revalidatePath(`/admin/${eventSlug}/groups`);
  return { success: true, groupCount: groups.length };
}

export async function updateGroupStatus(
  groupId: string,
  status: GroupStatus,
  eventSlug: string
) {
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
    .from("suggested_groups")
    .update({ status })
    .eq("id", groupId);

  if (error) return { error: "Failed to update group status" };

  revalidatePath(`/admin/${eventSlug}/groups`);
  return { success: true };
}
