"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";

function getAdminTimerPath(eventSlug: string, adminCode?: string) {
  return adminCode ? `/admin/${eventSlug}/${adminCode}/timer` : `/admin/${eventSlug}/timer`;
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
      return { valid: true as const };
    }

    return { valid: false as const, error: "Not authorized" };
  }

  const session = await getSession();
  if (!session) return { valid: false as const, error: "Not authenticated" };

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { valid: false as const, error: "Not authorized" };
  }

  return { valid: true as const };
}

async function getEventSlug(eventId: string) {
  const supabase = await createServiceClient();
  const { data: event } = await supabase
    .from("events")
    .select("slug, admin_code")
    .eq("id", eventId)
    .single();

  return event || null;
}

export async function startTimer(
  eventId: string,
  label: string,
  durationMinutes: number,
  adminCode?: string
) {
  const supabase = await createServiceClient();

  const auth = await validateAdminAccess(supabase, eventId, adminCode);
  if (!auth.valid) {
    return { error: auth.error || "Not authorized" };
  }

  const safeDuration = Math.max(1, Math.floor(durationMinutes || 0));
  if (!safeDuration) {
    return { error: "Duration must be at least 1 minute" };
  }

  const endTime = new Date(Date.now() + safeDuration * 60 * 1000).toISOString();
  const trimmedLabel = label?.trim() || null;

  const { error } = await supabase
    .from("events")
    .update({
      timer_label: trimmedLabel,
      timer_end_time: endTime,
      timer_active: true,
    })
    .eq("id", eventId);

  if (error) {
    console.error("[startTimer] Error:", error);
    return { error: "Failed to start timer" };
  }

  const event = await getEventSlug(eventId);
  if (event?.slug) {
    revalidatePath(`/${event.slug}`);
    revalidatePath(getAdminTimerPath(event.slug, adminCode || event.admin_code));
  }

  return { success: true };
}

export async function stopTimer(
  eventId: string,
  adminCode?: string
) {
  const supabase = await createServiceClient();

  const auth = await validateAdminAccess(supabase, eventId, adminCode);
  if (!auth.valid) {
    return { error: auth.error || "Not authorized" };
  }

  const { error } = await supabase
    .from("events")
    .update({
      timer_active: false,
      timer_end_time: null,
    })
    .eq("id", eventId);

  if (error) {
    console.error("[stopTimer] Error:", error);
    return { error: "Failed to stop timer" };
  }

  const event = await getEventSlug(eventId);
  if (event?.slug) {
    revalidatePath(`/${event.slug}`);
    revalidatePath(getAdminTimerPath(event.slug, adminCode || event.admin_code));
  }

  return { success: true };
}
