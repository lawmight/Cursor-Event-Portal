"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";

export async function uploadSlide(
  eventId: string,
  eventSlug: string,
  imageUrl: string,
  title?: string
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

  // Get max sort_order for this event
  const { data: existingSlides } = await supabase
    .from("slides")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxSortOrder = existingSlides && existingSlides.length > 0 
    ? existingSlides[0].sort_order 
    : -1;

  const { data: slide, error } = await supabase
    .from("slides")
    .insert({
      event_id: eventId,
      image_url: imageUrl,
      title: title || null,
      sort_order: maxSortOrder + 1,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create slide:", error);
    return { error: "Failed to create slide" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}/display`);
  return { success: true, slide };
}

export async function updateSlide(
  slideId: string,
  eventSlug: string,
  data: Partial<{
    title: string;
    sort_order: number;
    is_live: boolean;
  }>
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

  const { error } = await supabase
    .from("slides")
    .update(data)
    .eq("id", slideId);

  if (error) {
    console.error("Failed to update slide:", error);
    return { error: "Failed to update slide" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}/display`);
  revalidatePath(`/${eventSlug}/agenda`);
  return { success: true };
}

export async function toggleSlideLive(
  slideId: string,
  eventSlug: string,
  isLive: boolean
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

  // If setting to live, turn off all other slides first
  if (isLive) {
    const { data: slide } = await supabase
      .from("slides")
      .select("event_id")
      .eq("id", slideId)
      .single();

    if (slide) {
      await supabase
        .from("slides")
        .update({ is_live: false })
        .eq("event_id", slide.event_id);
    }
  }

  const { error } = await supabase
    .from("slides")
    .update({ is_live: isLive })
    .eq("id", slideId);

  if (error) {
    console.error("Failed to toggle slide:", error);
    return { error: "Failed to toggle slide" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}/display`);
  revalidatePath(`/${eventSlug}/agenda`);
  return { success: true };
}

export async function deleteSlide(slideId: string, eventSlug: string) {
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

  // Get slide to delete image from storage
  const { data: slide } = await supabase
    .from("slides")
    .select("image_url")
    .eq("id", slideId)
    .single();

  if (slide?.image_url) {
    // Extract file path from URL
    const url = new URL(slide.image_url);
    const filePath = url.pathname.split("/storage/v1/object/public/slides/")[1];
    if (filePath) {
      await supabase.storage.from("slides").remove([filePath]);
    }
  }

  const { error } = await supabase
    .from("slides")
    .delete()
    .eq("id", slideId);

  if (error) {
    console.error("Failed to delete slide:", error);
    return { error: "Failed to delete slide" };
  }

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}/display`);
  return { success: true };
}

export async function reorderSlides(
  eventSlug: string,
  slideIds: string[]
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

  // Update sort_order for each slide
  const updates = slideIds.map((id, index) =>
    supabase
      .from("slides")
      .update({ sort_order: index })
      .eq("id", id)
  );

  await Promise.all(updates);

  revalidatePath(`/admin/${eventSlug}/slides`);
  revalidatePath(`/${eventSlug}/display`);
  return { success: true };
}
