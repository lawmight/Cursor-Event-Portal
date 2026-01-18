"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";
import { getEventIntakes } from "@/lib/supabase/queries";
import type { GroupStatus, AttendeeIntake } from "@/types";
import OpenAI from "openai";

// Lazy initialization to avoid build-time errors
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey,
  });
}

async function generateGroupSuggestions(intakes: AttendeeIntake[]) {
  // Prepare intake summaries for the LLM
  const attendeeSummaries = intakes.map((intake) => ({
    id: intake.user_id,
    name: intake.user?.name || "Anonymous",
    goals: [...intake.goals, intake.goals_other].filter(Boolean),
    offers: [...intake.offers, intake.offers_other].filter(Boolean),
  }));

  const targetGroupSize = Math.min(5, Math.max(3, Math.ceil(intakes.length / 3)));

  const prompt = `You are an expert at forming productive networking groups at tech events.

Given these attendees with their goals and offers, create balanced groups of ${targetGroupSize}-${targetGroupSize + 1} people where members can help each other.

Attendees:
${JSON.stringify(attendeeSummaries, null, 2)}

Rules:
1. Match people whose OFFERS align with others' GOALS
2. Ensure diversity of skills in each group
3. Create groups that enable mutual value exchange
4. Name each group based on its primary theme
5. Every attendee should be in exactly one group

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "groups": [
    {
      "name": "Group theme name",
      "description": "Why these people are matched together",
      "memberIds": ["user-id-1", "user-id-2"],
      "matchReasons": {
        "user-id-1": "Why this person fits",
        "user-id-2": "Why this person fits"
      }
    }
  ]
}`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    });

    // Extract JSON from response
    const responseText = completion.choices[0]?.message?.content || "";

    // Try to parse as JSON directly first, then try to extract JSON from markdown
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Failed to parse LLM response:", responseText);
        throw new Error("Failed to parse LLM response");
      }
      result = JSON.parse(jsonMatch[0]);
    }

    return result.groups || [];
  } catch (error) {
    console.error("Group matching error:", error);
    throw error;
  }
}

export async function generateGroups(eventId: string, eventSlug: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  // Verify admin role
  const supabase = await createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  // Get all intakes
  const intakes = await getEventIntakes(eventId);
  if (intakes.length < 2) {
    return { error: "Need at least 2 intake responses to form groups" };
  }

  // Call LLM for matching directly
  let groups;
  try {
    groups = await generateGroupSuggestions(intakes);
  } catch (error) {
    console.error("Failed to generate groups:", error);
    return { 
      error: error instanceof Error ? error.message : "Failed to generate group suggestions" 
    };
  }

  if (!groups || !Array.isArray(groups)) {
    return { error: "Invalid response from AI" };
  }

  // Clear existing pending groups for this event
  await supabase
    .from("suggested_groups")
    .delete()
    .eq("event_id", eventId)
    .eq("status", "pending");

  // Store suggested groups
  for (const group of groups) {
    const { data: newGroup, error: groupError } = await supabase
      .from("suggested_groups")
      .insert({
        event_id: eventId,
        name: group.name,
        description: group.description,
        status: "pending",
      })
      .select("id")
      .single();

    if (groupError || !newGroup) continue;

    // Insert group members
    const members = group.memberIds.map((userId: string) => ({
      group_id: newGroup.id,
      user_id: userId,
      match_reason: group.matchReasons?.[userId] || null,
    }));

    await supabase.from("suggested_group_members").insert(members);
  }

  revalidatePath(`/admin/${eventSlug}/groups`);
  return { success: true, groupCount: groups.length };
}

export async function updateGroupStatus(
  groupId: string,
  status: GroupStatus,
  eventSlug: string
) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const supabase = await createServiceClient();

  // Verify admin role
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("suggested_groups")
    .update({ status })
    .eq("id", groupId);

  if (error) return { error: "Failed to update group status" };

  revalidatePath(`/admin/${eventSlug}/groups`);
  return { success: true };
}
