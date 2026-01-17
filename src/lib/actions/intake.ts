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
    console.error("submitIntake: Not authenticated", { session: !!session, eventId, sessionEventId: session?.eventId });
    return { error: "Not authenticated for this event" };
  }

  try {
    const supabase = await createServiceClient();

    // Check if already submitted
    const { data: existing, error: existingError } = await supabase
      .from("attendee_intakes")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("submitIntake: Error checking existing intake:", existingError);
      // Check if it's an API key error
      if (existingError.message?.includes("Invalid API key") || existingError.message?.includes("JWT")) {
        return { error: "Server configuration error. Please contact support." };
      }
      return { error: "Failed to check existing intake" };
    }

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
      console.error("submitIntake: Failed to save intake:", intakeError);
      // Check if it's an API key error
      if (intakeError.message?.includes("Invalid API key") || intakeError.message?.includes("JWT")) {
        return { error: "Server configuration error. Please contact support." };
      }
      return { error: `Failed to save intake: ${intakeError.message}` };
    }

    // Mark intake as completed on registration
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ intake_completed_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("user_id", session.userId);

    if (updateError) {
      console.error("submitIntake: Failed to update registration:", updateError);
      // Don't fail the whole operation if this update fails
    }

    revalidatePath(`/${eventSlug}/intake`);
    return { success: true };
  } catch (error) {
    console.error("submitIntake: Exception:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Check if it's an environment variable error
    if (errorMessage.includes("Missing") || errorMessage.includes("environment")) {
      return { error: "Server configuration error. Please contact support." };
    }
    return { error: `Failed to save intake: ${errorMessage}` };
  }
}

export async function skipIntake(eventId: string, eventSlug: string) {
  const session = await getSession();
  if (!session || session.eventId !== eventId) {
    return { error: "Not authenticated" };
  }

  try {
    const supabase = await createServiceClient();

    // Check if already submitted
    const { data: existing, error: existingError } = await supabase
      .from("attendee_intakes")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", session.userId)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("skipIntake: Error checking existing intake:", existingError);
      if (existingError.message?.includes("Invalid API key") || existingError.message?.includes("JWT")) {
        return { error: "Server configuration error. Please contact support." };
      }
      return { error: "Failed to check existing intake" };
    }

    if (existing) {
      // Already exists, just mark registration as complete
      const { error: updateError } = await supabase
        .from("registrations")
        .update({ intake_completed_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .eq("user_id", session.userId);

      if (updateError) {
        console.error("skipIntake: Failed to update registration:", updateError);
      }

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
      console.error("skipIntake: Failed to insert skipped intake:", error);
      if (error.message?.includes("Invalid API key") || error.message?.includes("JWT")) {
        return { error: "Server configuration error. Please contact support." };
      }
      return { error: `Failed to skip intake: ${error.message}` };
    }

    // Mark as completed (even if skipped)
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ intake_completed_at: new Date().toISOString() })
      .eq("event_id", eventId)
      .eq("user_id", session.userId);

    if (updateError) {
      console.error("skipIntake: Failed to update registration:", updateError);
    }

    revalidatePath(`/${eventSlug}/intake`);
    return { success: true };
  } catch (error) {
    console.error("skipIntake: Exception:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("Missing") || errorMessage.includes("environment")) {
      return { error: "Server configuration error. Please contact support." };
    }
    return { error: `Failed to skip intake: ${errorMessage}` };
  }
}

export async function getIntakeStatus(eventId: string, userId: string) {
  try {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("attendee_intakes")
      .select("id, skipped")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    // If error is "not found" (PGRST116), that's fine - just means no intake yet
    if (error && error.code !== "PGRST116") {
      console.error("getIntakeStatus: Error fetching intake:", error);
      // Return not completed if there's an error (safer default)
      return {
        completed: false,
        skipped: false,
      };
    }

    return {
      completed: !!data,
      skipped: data?.skipped || false,
    };
  } catch (error) {
    console.error("getIntakeStatus: Exception:", error);
    // Return not completed on error (safer default)
    return {
      completed: false,
      skipped: false,
    };
  }
}
