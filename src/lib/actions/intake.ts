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

    // Insert intake response (event-specific)
    const { error: intakeError } = await supabase.from("attendee_intakes").insert({
      event_id: eventId,
      user_id: session.userId,
      goals: formData.goals,
      goals_other: formData.goalsOther || null,
      offers: formData.offers,
      offers_other: formData.offersOther || null,
      role_category: formData.roleCategory || null,
      career_stage: formData.careerStage || null,
      founder_stage: formData.founderStage || null,
      years_experience: formData.yearsExperience ?? null,
      degree_type: formData.degreeType || null,
      socials: formData.socials || null,
      cursor_experience: formData.cursorExperience || null,
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

    // Also update the user's profile with their goals/offers (persistent across events)
    const { error: profileError } = await supabase
      .from("users")
      .update({
        goals: formData.goals,
        goals_other: formData.goalsOther || null,
        offers: formData.offers,
        offers_other: formData.offersOther || null,
        role_category: formData.roleCategory || null,
        career_stage: formData.careerStage || null,
        founder_stage: formData.founderStage || null,
        years_experience: formData.yearsExperience ?? null,
        degree_type: formData.degreeType || null,
        socials: formData.socials || null,
        cursor_experience: formData.cursorExperience || null,
      })
      .eq("id", session.userId);

    if (profileError) {
      // Log but don't fail - the event-specific intake was saved successfully
      console.error("submitIntake: Failed to update user profile:", profileError);
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
      role_category: null,
      career_stage: null,
      founder_stage: null,
      years_experience: null,
      degree_type: null,
      socials: null,
      cursor_experience: null,
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

export async function updateUserProfile(
  eventId: string,
  eventSlug: string,
  userId: string,
  formData: IntakeFormData
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  // Only allow users to update their own profile, or staff/admin to update any profile
  if (session.userId !== userId) {
    const supabase = await createServiceClient();
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.userId)
      .single();

    if (!user || !["staff", "admin"].includes(user.role)) {
      return { error: "Not authorized to update this profile" };
    }
  }

  try {
    const supabase = await createServiceClient();

    // Update user profile (persistent goals/offers)
    const { error: profileError } = await supabase
      .from("users")
      .update({
        goals: formData.goals,
        goals_other: formData.goalsOther || null,
        offers: formData.offers,
        offers_other: formData.offersOther || null,
        role_category: formData.roleCategory || null,
        career_stage: formData.careerStage || null,
        founder_stage: formData.founderStage || null,
        years_experience: formData.yearsExperience ?? null,
        degree_type: formData.degreeType || null,
        socials: formData.socials || null,
        cursor_experience: formData.cursorExperience || null,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("updateUserProfile: Failed to update user profile:", profileError);
      return { error: `Failed to update profile: ${profileError.message}` };
    }

    // Also update or create the event-specific intake if it exists
    const { data: existingIntake } = await supabase
      .from("attendee_intakes")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingIntake) {
      // Update existing intake
      const { error: intakeError } = await supabase
        .from("attendee_intakes")
        .update({
          goals: formData.goals,
          goals_other: formData.goalsOther || null,
          offers: formData.offers,
          offers_other: formData.offersOther || null,
          role_category: formData.roleCategory || null,
          career_stage: formData.careerStage || null,
          founder_stage: formData.founderStage || null,
          years_experience: formData.yearsExperience ?? null,
          degree_type: formData.degreeType || null,
          socials: formData.socials || null,
          cursor_experience: formData.cursorExperience || null,
          skipped: false,
        })
        .eq("id", existingIntake.id);

      if (intakeError) {
        console.error("updateUserProfile: Failed to update intake:", intakeError);
        // Don't fail - profile was updated successfully
      }
    } else {
      // Create new intake for this event
      const { error: intakeError } = await supabase.from("attendee_intakes").insert({
        event_id: eventId,
        user_id: userId,
        goals: formData.goals,
        goals_other: formData.goalsOther || null,
        offers: formData.offers,
        offers_other: formData.offersOther || null,
        role_category: formData.roleCategory || null,
        career_stage: formData.careerStage || null,
        founder_stage: formData.founderStage || null,
        years_experience: formData.yearsExperience ?? null,
        degree_type: formData.degreeType || null,
        socials: formData.socials || null,
        cursor_experience: formData.cursorExperience || null,
        skipped: false,
      });

      if (intakeError) {
        console.error("updateUserProfile: Failed to create intake:", intakeError);
        // Don't fail - profile was updated successfully
      }

      // Mark intake as completed on registration
      await supabase
        .from("registrations")
        .update({ intake_completed_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .eq("user_id", userId);
    }

    revalidatePath(`/${eventSlug}`);
    revalidatePath(`/staff/${eventSlug}/checkin`);
    return { success: true };
  } catch (error) {
    console.error("updateUserProfile: Exception:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to update profile: ${errorMessage}` };
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
