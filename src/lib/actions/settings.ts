"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EventStatus } from "@/types";

async function assertEventAdmin(eventId: string, adminCode: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient();
  const { data: event } = await supabase
    .from("events")
    .select("admin_code")
    .eq("id", eventId)
    .maybeSingle();
  if (!event?.admin_code || event.admin_code !== adminCode) {
    return { error: "Unauthorized" };
  }
  return {};
}

async function assertAdminForTargetSlug(slug: string, adminCode: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient();
  const { data: event } = await supabase
    .from("events")
    .select("admin_code")
    .eq("slug", slug.trim())
    .maybeSingle();
  if (!event?.admin_code || event.admin_code !== adminCode) {
    return { error: "Unauthorized" };
  }
  return {};
}

export async function setActiveEventSlug(
  slug: string,
  adminCode: string
): Promise<{ error?: string }> {
  const auth = await assertAdminForTargetSlug(slug, adminCode);
  if (auth.error) return auth;

  const service = await createServiceClient();
  const { error } = await service
    .from("app_settings")
    .upsert({ key: "active_event_slug", value: slug.trim(), updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  return {};
}

export async function setEventStatus(
  eventId: string,
  status: EventStatus,
  adminCode: string
): Promise<{ error?: string }> {
  const auth = await assertEventAdmin(eventId, adminCode);
  if (auth.error) return auth;

  const service = await createServiceClient();
  const { error } = await service
    .from("events")
    .update({ status })
    .eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return {};
}
