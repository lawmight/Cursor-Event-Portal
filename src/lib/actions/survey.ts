"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";

export async function submitSurveyResponse(
  surveyId: string,
  eventSlug: string,
  responses: Record<string, unknown>
) {
  const session = await getSession();

  const supabase = await createServiceClient();

  const { error } = await supabase.from("survey_responses").insert({
    survey_id: surveyId,
    user_id: session?.userId || null,
    responses,
  });

  if (error) {
    return { error: "Failed to submit survey" };
  }

  revalidatePath(`/${eventSlug}/feedback`);
  return { success: true };
}

export async function createSurvey(
  eventId: string,
  eventSlug: string,
  title: string,
  schema: { fields: Array<{ id: string; type: string; label: string; required: boolean; options?: string[] }> }
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Verify user is admin
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("surveys")
    .insert({
      event_id: eventId,
      title,
      schema,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create survey" };
  }

  revalidatePath(`/admin/${eventSlug}/surveys`);
  return { success: true, surveyId: data.id };
}

export async function publishSurvey(surveyId: string, eventSlug: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Verify user is admin
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  // Unpublish any other published surveys for this event
  const { data: survey } = await supabase
    .from("surveys")
    .select("event_id")
    .eq("id", surveyId)
    .single();

  if (survey) {
    await supabase
      .from("surveys")
      .update({ published_at: null })
      .eq("event_id", survey.event_id)
      .neq("id", surveyId);
  }

  const { error } = await supabase
    .from("surveys")
    .update({ published_at: new Date().toISOString() })
    .eq("id", surveyId);

  if (error) {
    return { error: "Failed to publish survey" };
  }

  revalidatePath(`/admin/${eventSlug}/surveys`);
  revalidatePath(`/${eventSlug}/feedback`);
  return { success: true };
}

export async function unpublishSurvey(surveyId: string, eventSlug: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Verify user is admin
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("surveys")
    .update({ published_at: null })
    .eq("id", surveyId);

  if (error) {
    return { error: "Failed to unpublish survey" };
  }

  revalidatePath(`/admin/${eventSlug}/surveys`);
  revalidatePath(`/${eventSlug}/feedback`);
  return { success: true };
}

export async function deleteSurvey(surveyId: string, eventSlug: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Verify user is admin
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("surveys")
    .delete()
    .eq("id", surveyId);

  if (error) {
    return { error: "Failed to delete survey" };
  }

  revalidatePath(`/admin/${eventSlug}/surveys`);
  revalidatePath(`/${eventSlug}/feedback`);
  return { success: true };
}

export async function exportSurveyResponses(surveyId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Verify user is admin
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { data: responses, error } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("survey_id", surveyId);

  if (error) {
    return { error: "Failed to export responses" };
  }

  return { success: true, responses };
}
