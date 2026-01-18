"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Slide } from "@/types";

export async function uploadSlide(
  eventId: string,
  eventSlug: string,
  imageUrl: string,
  title?: string
) {
  const supabase = await createServiceClient();

  // Get the current max sort_order
  const { data: existingSlides } = await supabase
    .from("slides")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existingSlides?.[0]?.sort_order ?? -1;

  const { data, error } = await supabase
    .from("slides")
    .insert({
      event_id: eventId,
      image_url: imageUrl,
      title: title || null,
      sort_order: nextOrder + 1,
      is_live: false,
    })
    .select()
    .single();

  if (error) {
    console.error("[uploadSlide] Error:", error);
    return { error: "Failed to save slide" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  return { success: true, slide: data };
}

export async function deleteSlide(slideId: string, eventSlug: string) {
  const supabase = await createServiceClient();

  const { error } = await supabase.from("slides").delete().eq("id", slideId);

  if (error) {
    console.error("[deleteSlide] Error:", error);
    return { error: "Failed to delete slide" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  return { success: true };
}

export async function updateSlide(
  slideId: string,
  eventSlug: string,
  data: { title?: string }
) {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("slides")
    .update({ title: data.title || null })
    .eq("id", slideId);

  if (error) {
    console.error("[updateSlide] Error:", error);
    return { error: "Failed to update slide" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  return { success: true };
}

export async function reorderSlides(eventSlug: string, slideIds: string[]) {
  const supabase = await createServiceClient();

  // Update each slide's sort_order based on its position in the array
  const updates = slideIds.map((id, index) =>
    supabase.from("slides").update({ sort_order: index }).eq("id", id)
  );

  await Promise.all(updates);

  revalidatePath(`/admin/${eventSlug}/slides`);
  return { success: true };
}

export async function toggleSlideLive(
  slideId: string,
  eventSlug: string,
  isLive: boolean
) {
  const supabase = await createServiceClient();

  // First get the slide to find its event_id
  const { data: slide } = await supabase
    .from("slides")
    .select("event_id")
    .eq("id", slideId)
    .single();

  if (!slide) {
    return { error: "Slide not found" };
  }

  // If turning on, turn off all other slides for this event first
  if (isLive) {
    await supabase
      .from("slides")
      .update({ is_live: false })
      .eq("event_id", slide.event_id);
  }

  // Update this slide
  const { error } = await supabase
    .from("slides")
    .update({ is_live: isLive })
    .eq("id", slideId);

  if (error) {
    console.error("[toggleSlideLive] Error:", error);
    return { error: "Failed to update slide" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}`);
  revalidatePath(`/${eventSlug}/agenda`);
  revalidatePath(`/${eventSlug}/slides`);
  return { success: true };
}

export async function getSlides(eventId: string): Promise<Slide[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getSlides] Error:", error);
    return [];
  }

  return data || [];
}

export async function getLiveSlide(eventId: string): Promise<Slide | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_live", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function hasLiveSlide(eventId: string): Promise<boolean> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("slides")
    .select("id")
    .eq("event_id", eventId)
    .eq("is_live", true)
    .limit(1);

  if (error) {
    return false;
  }

  return (data?.length || 0) > 0;
}
