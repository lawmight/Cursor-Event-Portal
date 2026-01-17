import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AttendeeIntake } from "@/types";

// Lazy initialization to avoid build-time errors
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { intakes } = (await request.json()) as {
      eventId: string;
      intakes: AttendeeIntake[];
    };

    if (!intakes || intakes.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 intakes" },
        { status: 400 }
      );
    }

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
        return NextResponse.json(
          { error: "Failed to parse LLM response" },
          { status: 500 }
        );
      }
      result = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Group matching error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
