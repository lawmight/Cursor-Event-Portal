"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";
import type { HelpCategory } from "@/types";

function getAdminHelpPath(eventSlug: string, adminCode?: string) {
  return adminCode ? `/admin/${eventSlug}/${adminCode}/help` : `/admin/${eventSlug}/help`;
}

async function validateAdminAccess(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  eventId: string,
  adminCode?: string
) {
  if (adminCode) {
    const { data: event } = await supabase
      .from("events")
      .select("admin_code")
      .eq("id", eventId)
      .single();

    if (event && event.admin_code === adminCode) {
      const session = await getSession();
      let userId = session?.userId;

      if (!userId) {
        const { data: adminUser } = await supabase
          .from("users")
          .select("id")
          .eq("role", "admin")
          .limit(1)
          .maybeSingle();
        userId = adminUser?.id;
      }

      return { valid: true as const, userId };
    }

    return { valid: false as const, error: "Not authorized" };
  }

  const session = await getSession();
  if (!session) {
    return { valid: false as const, error: "Not authenticated" };
  }

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || !["staff", "admin", "facilitator"].includes(user.role)) {
    return { valid: false as const, error: "Not authorized" };
  }

  return { valid: true as const, userId: session.userId };
}

async function revalidateHelpPaths(eventId: string, eventSlug: string, adminCode?: string) {
  revalidatePath(`/${eventSlug}/help`);
  revalidatePath(getAdminHelpPath(eventSlug, adminCode));

  if (!adminCode) {
    const supabase = await createServiceClient();
    const { data: event } = await supabase
      .from("events")
      .select("admin_code")
      .eq("id", eventId)
      .single();

    if (event?.admin_code) {
      revalidatePath(getAdminHelpPath(eventSlug, event.admin_code));
    }
  }
}

export async function createHelpRequest(
  eventId: string,
  eventSlug: string,
  data: { category: HelpCategory; description: string }
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();
  const description = data.description?.trim();

  if (!description) {
    return { error: "Description is required" };
  }

  const { error } = await supabase
    .from("help_requests")
    .insert({
      event_id: eventId,
      user_id: session.userId,
      category: data.category,
      description,
      status: "waiting",
    });

  if (error) {
    console.error("[createHelpRequest] Error:", error);
    return { error: "Failed to create help request" };
  }

  await revalidateHelpPaths(eventId, eventSlug);
  return { success: true };
}

export async function claimHelpRequest(
  requestId: string,
  eventId: string,
  eventSlug: string,
  adminCode?: string
) {
  const supabase = await createServiceClient();
  const auth = await validateAdminAccess(supabase, eventId, adminCode);

  if (!auth.valid) {
    return { error: auth.error || "Not authorized" };
  }

  if (!auth.userId) {
    return { error: "No admin user available" };
  }

  const { error } = await supabase
    .from("help_requests")
    .update({
      status: "helping",
      claimed_by: auth.userId,
    })
    .eq("id", requestId)
    .eq("event_id", eventId);

  if (error) {
    console.error("[claimHelpRequest] Error:", error);
    return { error: "Failed to claim help request" };
  }

  await revalidateHelpPaths(eventId, eventSlug, adminCode);
  return { success: true };
}

export async function resolveHelpRequest(
  requestId: string,
  eventId: string,
  eventSlug: string,
  adminCode?: string
) {
  const supabase = await createServiceClient();
  const auth = await validateAdminAccess(supabase, eventId, adminCode);

  if (!auth.valid) {
    return { error: auth.error || "Not authorized" };
  }

  const { error } = await supabase
    .from("help_requests")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("event_id", eventId);

  if (error) {
    console.error("[resolveHelpRequest] Error:", error);
    return { error: "Failed to resolve help request" };
  }

  await revalidateHelpPaths(eventId, eventSlug, adminCode);
  return { success: true };
}

export async function cancelHelpRequest(
  requestId: string,
  eventId: string,
  eventSlug: string
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();
  const { data: request, error: fetchError } = await supabase
    .from("help_requests")
    .select("user_id")
    .eq("id", requestId)
    .eq("event_id", eventId)
    .single();

  if (fetchError || !request) {
    return { error: "Help request not found" };
  }

  if (request.user_id !== session.userId) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("help_requests")
    .update({
      status: "cancelled",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("event_id", eventId);

  if (error) {
    console.error("[cancelHelpRequest] Error:", error);
    return { error: "Failed to cancel help request" };
  }

  await revalidateHelpPaths(eventId, eventSlug);
  return { success: true };
}
