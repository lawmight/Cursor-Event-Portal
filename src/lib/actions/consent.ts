"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";
import { revalidatePath } from "next/cache";

export async function submitSurveyConsent(
  eventId: string,
  eventSlug: string,
  consented: boolean
) {
  const session = await getSession();
  if (!session || session.eventId !== eventId) {
    return { error: "Not authenticated" };
  }

  if (!consented) {
    return { error: "Consent is required to continue" };
  }

  const supabase = await createServiceClient();

  // Update registration with survey consent timestamp
  const { error } = await supabase
    .from("registrations")
    .update({
      survey_consent_at: new Date().toISOString(),
    })
    .eq("event_id", eventId)
    .eq("user_id", session.userId);

  if (error) {
    console.error("[submitSurveyConsent] Error:", error);
    return { error: "Failed to save consent" };
  }

  revalidatePath(`/${eventSlug}/agenda`);
  return { success: true };
}

export async function getSurveyConsentStatus(eventId: string, userId: string) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("registrations")
    .select("survey_consent_at")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { hasConsented: false };
  }

  return { hasConsented: !!data.survey_consent_at };
}
