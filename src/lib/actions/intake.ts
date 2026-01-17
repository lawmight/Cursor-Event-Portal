"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";
import type { IntakeFormData } from "@/types";

export async function submitIntake(
  eventId: string,
  eventSlug: string,
  formData: IntakeFormData
) {
  const session = await getSession();
  if (!session || session.eventId !== eventId) {
    return { error: "Not authenticated for this event" };
  }

  const supabase = await createServiceClient();

  // Check if already submitted
  const { data: existing } = await supabase
    .from("attendee_intakes")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", session.userId)
    .single();

  if (existing) {
    return { error: "Already submitted intake" };
  }

  // Insert intake response
  const { error: intakeError } = await supabase.from("attendee_intakes").insert({
    event_id: eventId,
    user_id: session.userId,
    goals: formData.goals,
    goals_other: formData.goalsOther || null,
    offers: formData.offers,
    offers_other: formData.offersOther || null,
    skipped: false,
  });

  if (intakeError) {
    return { error: "Failed to save intake" };
  }

  // Mark intake as completed on registration
  await supabase
    .from("registrations")
    .update({ intake_completed_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("user_id", session.userId);

  revalidatePath(`/${eventSlug}/intake`);
  return { success: true };
}

export async function skipIntake(eventId: string, eventSlug: string) {
  const session = await getSession();
  if (!session || session.eventId !== eventId) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Check if already submitted
  const { data: existing } = await supabase
    .from("attendee_intakes")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", session.userId)
    .single();

  if (existing) {
    // Already exists, just mark registration as complete
    await supabase
      .from("registrations")
      .update({ intake_completed_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("user_id", session.userId);

    return { success: true };
  }

  // Insert skipped intake
  const { error } = await supabase.from("attendee_intakes").insert({
    event_id: eventId,
    user_id: session.userId,
    goals: [],
    offers: [],
    skipped: true,
  });

  if (error) {
    return { error: "Failed to skip intake" };
  }

  // Mark as completed (even if skipped)
  await supabase
    .from("registrations")
    .update({ intake_completed_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("user_id", session.userId);

  revalidatePath(`/${eventSlug}/intake`);
  return { success: true };
}

export async function getIntakeStatus(eventId: string, userId: string) {
  const supabase = await createServiceClient();

  const { data } = await supabase
    .from("attendee_intakes")
    .select("id, skipped")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  return {
    completed: !!data,
    skipped: data?.skipped || false,
  };
}
