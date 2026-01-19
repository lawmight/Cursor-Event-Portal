"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";

export async function removeSlideDeck(eventId: string, eventSlug: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

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
  isLive: boolean
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
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
  popupVisible: boolean
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
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
