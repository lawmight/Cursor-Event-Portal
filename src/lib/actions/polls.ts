"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";

export async function votePoll(
  pollId: string,
  optionIndex: number,
  eventSlug: string
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Check if poll exists and is active
  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (!poll) {
    return { error: "Poll not found" };
  }

  if (!poll.is_active) {
    return { error: "Poll is no longer active" };
  }

  // Check if poll has ended
  if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
    return { error: "Poll has ended" };
  }

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", session.userId)
    .single();

  if (existingVote) {
    // Update existing vote
    const { error } = await supabase
      .from("poll_votes")
      .update({ option_index: optionIndex })
      .eq("poll_id", pollId)
      .eq("user_id", session.userId);

    if (error) {
      console.error("Failed to update vote:", error);
      return { error: "Failed to update vote" };
    }
  } else {
    // Create new vote
    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollId,
      user_id: session.userId,
      option_index: optionIndex,
    });

    if (error) {
      console.error("Failed to create vote:", error);
      return { error: "Failed to submit vote" };
    }
  }

  revalidatePath(`/${eventSlug}/polls`);
  return { success: true };
}

export async function createPoll(
  eventId: string,
  eventSlug: string,
  data: {
    question: string;
    options: string[];
    ends_at?: string;
    is_active?: boolean;
  }
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

  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      event_id: eventId,
      question: data.question,
      options: data.options,
      ends_at: data.ends_at || null,
      is_active: data.is_active ?? false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create poll:", error);
    return { error: "Failed to create poll" };
  }

  revalidatePath(`/admin/${eventSlug}/polls`);
  revalidatePath(`/${eventSlug}/polls`);
  return { success: true, pollId: poll.id };
}

export async function updatePoll(
  pollId: string,
  eventSlug: string,
  data: {
    question?: string;
    options?: string[];
    ends_at?: string | null;
    is_active?: boolean;
    show_results?: boolean;
  }
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
    .from("polls")
    .update(data)
    .eq("id", pollId);

  if (error) {
    console.error("Failed to update poll:", error);
    return { error: "Failed to update poll" };
  }

  revalidatePath(`/admin/${eventSlug}/polls`);
  revalidatePath(`/${eventSlug}/polls`);
  return { success: true };
}

export async function deletePoll(pollId: string, eventSlug: string) {
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

  const { error } = await supabase.from("polls").delete().eq("id", pollId);

  if (error) {
    console.error("Failed to delete poll:", error);
    return { error: "Failed to delete poll" };
  }

  revalidatePath(`/admin/${eventSlug}/polls`);
  revalidatePath(`/${eventSlug}/polls`);
  return { success: true };
}

export async function togglePollActive(pollId: string, eventSlug: string) {
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

  // Get current state
  const { data: poll } = await supabase
    .from("polls")
    .select("is_active")
    .eq("id", pollId)
    .single();

  if (!poll) {
    return { error: "Poll not found" };
  }

  const { error } = await supabase
    .from("polls")
    .update({ is_active: !poll.is_active })
    .eq("id", pollId);

  if (error) {
    console.error("Failed to toggle poll:", error);
    return { error: "Failed to toggle poll" };
  }

  revalidatePath(`/admin/${eventSlug}/polls`);
  revalidatePath(`/${eventSlug}/polls`);
  return { success: true, is_active: !poll.is_active };
}
