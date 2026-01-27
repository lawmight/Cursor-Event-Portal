"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";

// Helper to validate admin access via session or admin code
async function validateAdminAccess(eventId: string, adminCode?: string) {
  const supabase = await createServiceClient();

  // If admin code provided, validate it
  if (adminCode) {
    const { data: event } = await supabase
      .from("events")
      .select("admin_code")
      .eq("id", eventId)
      .single();

    if (event && event.admin_code === adminCode) {
      return { valid: true, supabase };
    }
    return { valid: false, error: "Invalid admin code" };
  }

  // Fall back to session auth
  const session = await getSession();
  if (!session) {
    return { valid: false, error: "Not authenticated" };
  }

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { valid: false, error: "Not authorized" };
  }

  return { valid: true, supabase };
}

export async function removeSlideDeck(eventId: string, eventSlug: string, adminCode?: string) {
  const auth = await validateAdminAccess(eventId, adminCode);
  if (!auth.valid) {
    return { error: auth.error };
  }

  const supabase = auth.supabase!;

  const { data: deck } = await supabase
    .from("slide_decks")
    .select("storage_path")
    .eq("event_id", eventId)
    .single();

  if (deck?.storage_path) {
    await supabase.storage.from("slide-decks").remove([deck.storage_path]);
  }

  const { error } = await supabase
    .from("slide_decks")
    .delete()
    .eq("event_id", eventId);

  if (error) {
    console.error("Failed to remove slide deck:", error);
    return { error: "Failed to remove slide deck" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}/display`);
  return { success: true };
}

export async function toggleSlideDeckLive(
  eventId: string,
  eventSlug: string,
  isLive: boolean,
  adminCode?: string
) {
  const auth = await validateAdminAccess(eventId, adminCode);
  if (!auth.valid) {
    return { error: auth.error };
  }

  const { error } = await auth.supabase!
    .from("slide_decks")
    .update({ is_live: isLive })
    .eq("event_id", eventId);

  if (error) {
    console.error("Failed to toggle slide deck live status:", error);
    return { error: "Failed to update slide deck" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}/display`);
  revalidatePath(`/${eventSlug}`);
  return { success: true };
}

export async function toggleSlideDeckPopup(
  eventId: string,
  eventSlug: string,
  popupVisible: boolean,
  adminCode?: string
) {
  const auth = await validateAdminAccess(eventId, adminCode);
  if (!auth.valid) {
    return { error: auth.error };
  }

  const { error } = await auth.supabase!
    .from("slide_decks")
    .update({ popup_visible: popupVisible })
    .eq("event_id", eventId);

  if (error) {
    console.error("Failed to toggle slide deck popup:", error);
    return { error: "Failed to update slide deck popup" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}`);
  return { success: true };
}

export async function updateSlideCurrentPage(
  eventId: string,
  pageNumber: number,
  adminCode?: string
) {
  const auth = await validateAdminAccess(eventId, adminCode);
  if (!auth.valid) {
    return { error: auth.error };
  }

  const { error } = await auth.supabase!
    .from("slide_decks")
    .update({ current_page: pageNumber })
    .eq("event_id", eventId);

  if (error) {
    console.error("Failed to update current page:", error);
    return { error: "Failed to update current page" };
  }

  // No revalidation needed - realtime handles updates
  return { success: true };
}
