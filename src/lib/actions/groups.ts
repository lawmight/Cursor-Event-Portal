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

  const prompt = `You are an expert at creating high-value networking opportunities at tech events. Your goal is to form groups where each person can meet others who can genuinely help them achieve their goals.

CRITICAL MATCHING STRATEGY:
- For each person, identify who in the pool can BEST help them achieve their stated GOALS
- Prioritize matches where Person A's OFFERS directly address Person B's GOALS
- Create groups where there are MULTIPLE mutual benefit connections (not just one-to-one)
- Ensure every person in a group has at least one other person whose offers align with their goals
- Maximize the number of "value exchanges" within each group

Attendees:
${JSON.stringify(attendeeSummaries, null, 2)}

Your task:
Create ${Math.ceil(attendeeSummaries.length / targetGroupSize)} groups of ${targetGroupSize}-${targetGroupSize + 1} people each, where:
1. Each person's GOALS are matched with at least one other person's OFFERS in the same group
2. Groups enable multiple mutual benefit connections (Person A helps Person B, Person B helps Person C, Person C helps Person A, etc.)
3. Each group has a clear theme based on the primary value exchange opportunities
4. Every attendee is placed in exactly one group
5. Groups are balanced - avoid putting all similar people together; create complementary skill/interest diversity

For each group, explain:
- The primary theme and why these people benefit from meeting each other
- For each member, specifically which other member(s) can help them and how

IMPORTANT: In matchReasons, use the person's NAME (not their ID) when referring to other members.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "groups": [
    {
      "name": "Group theme name (e.g., 'AI Founders & Technical Talent')",
      "description": "Detailed explanation of why these people are matched together and the mutual benefit opportunities",
      "memberIds": ["user-id-1", "user-id-2", "user-id-3"],
      "matchReasons": {
        "user-id-1": "Can benefit from meeting [Person Name 2] (who offers X which aligns with their goal Y) and [Person Name 3] (who offers Z)",
        "user-id-2": "Can benefit from meeting [Person Name 1] (who offers A which aligns with their goal B)",
        "user-id-3": "Can benefit from meeting [Person Name 1] (who offers C which aligns with their goal D)"
      }
    }
  ]
}

Remember: Use actual names from the attendees list in matchReasons, NOT user IDs.`;

  try {
    console.log("[generateGroupSuggestions] Calling OpenAI API with", attendeeSummaries.length, "attendees");
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert networking facilitator specializing in creating high-value connections at tech events. Your expertise is in identifying complementary skills, goals, and offers to maximize mutual benefit opportunities. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8, // Slightly higher for more creative matching
      max_tokens: 3000, // Increased for more detailed explanations
    });

    console.log("[generateGroupSuggestions] OpenAI API call successful");

    // Extract JSON from response
    const responseText = completion.choices[0]?.message?.content || "";
    console.log("[generateGroupSuggestions] Response length:", responseText.length, "characters");

    // Try to parse as JSON directly first, then try to extract JSON from markdown
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.warn("[generateGroupSuggestions] Direct JSON parse failed, trying to extract JSON from response");
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[generateGroupSuggestions] Failed to parse LLM response:", responseText.substring(0, 500));
        throw new Error("Failed to parse LLM response as JSON");
      }
      result = JSON.parse(jsonMatch[0]);
    }

    let groups = result.groups || [];
    console.log("[generateGroupSuggestions] Successfully parsed", groups.length, "groups from OpenAI response");
    
    // Create a map of user IDs to names for replacing IDs in matchReasons
    const userIdToName = new Map<string, string>();
    attendeeSummaries.forEach((attendee) => {
      userIdToName.set(attendee.id, attendee.name);
    });
    
    // Process groups to replace any user IDs in matchReasons with names
    groups = groups.map((group: any) => {
      if (group.matchReasons && typeof group.matchReasons === 'object') {
        const processedReasons: Record<string, string> = {};
        Object.keys(group.matchReasons).forEach((userId) => {
          let reason = group.matchReasons[userId];
          // Replace any user IDs in the reason text with names
          userIdToName.forEach((name, id) => {
            // Replace ID references with names
            reason = reason.replace(new RegExp(id, 'g'), name);
          });
          processedReasons[userId] = reason;
        });
        return { ...group, matchReasons: processedReasons };
      }
      return group;
    });
    
    console.log("[generateGroupSuggestions] Processed match reasons to use names instead of IDs");
    
    return groups;
  } catch (error) {
    console.error("[generateGroupSuggestions] OpenAI API error:", error);
    if (error instanceof Error) {
      console.error("[generateGroupSuggestions] Error message:", error.message);
      console.error("[generateGroupSuggestions] Error stack:", error.stack);
    }
    throw error;
  }
}

export async function generateGroups(eventId: string, eventSlug: string) {
  console.log("[generateGroups] Starting group generation for event:", eventId);
  
  const session = await getSession();
  if (!session) {
    console.log("[generateGroups] Not authenticated");
    return { error: "Not authenticated" };
  }

  // Verify admin role
  const supabase = await createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    console.log("[generateGroups] Not authorized");
    return { error: "Not authorized" };
  }

  // Get all intakes
  const intakes = await getEventIntakes(eventId);
  console.log("[generateGroups] Found intakes:", intakes.length);
  
  if (intakes.length < 2) {
    return { error: "Need at least 2 intake responses to form groups" };
  }

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error("[generateGroups] OPENAI_API_KEY is not set");
    return { error: "OpenAI API key is not configured. Please contact support." };
  }

  // Call LLM for matching directly
  let groups;
  try {
    console.log("[generateGroups] Calling OpenAI to generate groups...");
    groups = await generateGroupSuggestions(intakes);
    console.log("[generateGroups] Generated groups:", groups?.length || 0);
  } catch (error) {
    console.error("[generateGroups] Failed to generate groups:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate group suggestions";
    return { error: errorMessage };
  }

  if (!groups || !Array.isArray(groups) || groups.length === 0) {
    console.error("[generateGroups] Invalid or empty groups response:", groups);
    return { error: "Invalid response from AI or no groups generated" };
  }

  // Clear existing pending groups for this event
  console.log("[generateGroups] Clearing existing pending groups...");
  const { error: deleteError } = await supabase
    .from("suggested_groups")
    .delete()
    .eq("event_id", eventId)
    .eq("status", "pending");

  if (deleteError) {
    console.error("[generateGroups] Error clearing existing groups:", deleteError);
  }

  // Store suggested groups with sequential table numbers
  let savedCount = 0;
  let tableNumber = 1;
  for (const group of groups) {
    const { data: newGroup, error: groupError } = await supabase
      .from("suggested_groups")
      .insert({
        event_id: eventId,
        name: group.name,
        description: group.description,
        status: "pending",
        table_number: tableNumber,
      })
      .select("id")
      .single();
    
    tableNumber++; // Increment for next group

    if (groupError || !newGroup) {
      console.error("[generateGroups] Error saving group:", groupError, group);
      continue;
    }

    // Insert group members
    if (group.memberIds && Array.isArray(group.memberIds)) {
      const members = group.memberIds.map((userId: string) => ({
        group_id: newGroup.id,
        user_id: userId,
        match_reason: group.matchReasons?.[userId] || null,
      }));

      const { error: membersError } = await supabase
        .from("suggested_group_members")
        .insert(members);

      if (membersError) {
        console.error("[generateGroups] Error saving group members:", membersError);
      } else {
        savedCount++;
      }
    }
  }

  console.log("[generateGroups] Saved", savedCount, "out of", groups.length, "groups");

  revalidatePath(`/admin/${eventSlug}/groups`);
  return { success: true, groupCount: savedCount };
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

export async function updateGroupTableNumber(
  groupId: string,
  tableNumber: number | null,
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
    .update({ table_number: tableNumber })
    .eq("id", groupId);

  if (error) return { error: "Failed to update table number" };

  revalidatePath(`/admin/${eventSlug}/groups`);
  return { success: true };
}
