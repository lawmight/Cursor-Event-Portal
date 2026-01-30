"use server";

import OpenAI from "openai";
import type { AttendeeIntake } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttendeeProfile {
  id: string;
  name: string;
  email: string | null;
  goals: string[];
  offers: string[];
  roleCategory: string | null;
  founderStage: string | null;
  yearsExperience: number | null;
  cursorExperience: string | null;
  intent: string | null;
  domain: string | null;
  skipped: boolean;
}

interface MatchingResult {
  groups: Array<{
    name: string;
    description: string;
    memberIds: string[];
    matchReasons: Record<string, string>;
    score: number;
    constraints: MatchConstraint[];
  }>;
}

interface MatchConstraint {
  type: "company" | "domain" | "mutual_benefit" | "dominator";
  severity: "hard" | "soft";
  value: any;
}

/** Pairwise semantic similarity between two attendees' goals↔offers */
interface PairScore {
  a: string; // user id
  b: string; // user id
  goalToOfferSim: number; // how well A's goals match B's offers
  offerToGoalSim: number; // how well A's offers match B's goals
  avgSim: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

function extractDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const match = email.match(/@(.+)/);
  return match ? match[1].toLowerCase() : null;
}

const GOAL_LABELS: Record<string, string> = {
  "learn-ai": "Learn AI/ML",
  "learn-coding": "Learn Coding",
  networking: "Networking",
  "find-cofounders": "Find Co-founders",
  "hire-talent": "Hire Talent",
  "find-job": "Job Search",
  "explore-tools": "Explore Tools",
  other: "Other",
};

const OFFER_LABELS: Record<string, string> = {
  "ai-expertise": "AI/ML Expertise",
  "software-dev": "Software Development",
  design: "Design",
  "business-strategy": "Business Strategy",
  "funding-investment": "Funding & Investment",
  mentorship: "Mentorship",
  collaboration: "Collaboration",
  other: "Other",
};

function humanGoals(tags: string[], other: string | null): string[] {
  const out = tags.map((t) => GOAL_LABELS[t] || t).filter(Boolean);
  if (other) out.push(other);
  return out.length > 0 ? out : ["General networking"];
}

function humanOffers(tags: string[], other: string | null): string[] {
  const out = tags.map((t) => OFFER_LABELS[t] || t).filter(Boolean);
  if (other) out.push(other);
  return out.length > 0 ? out : ["Open to connect"];
}

function roleLabel(cat: string | null): string | null {
  if (!cat) return null;
  const map: Record<string, string> = {
    founder: "Founder",
    professional: "Professional",
    student: "Student",
    other: "Other",
  };
  return map[cat] ?? cat;
}

function founderLabel(stage: string | null): string | null {
  if (!stage) return null;
  const map: Record<string, string> = {
    idea: "Idea stage",
    "pre-seed": "Pre-seed",
    seed: "Seed",
    "series-a": "Series A",
    "series-b-plus": "Series B+",
    bootstrapped: "Bootstrapped",
    other: "Other stage",
  };
  return map[stage] ?? stage;
}

function cursorLabel(exp: string | null): string | null {
  if (!exp) return null;
  const map: Record<string, string> = {
    none: "No Cursor experience",
    curious: "Cursor-curious",
    trialed: "Has trialed Cursor",
    active: "Active Cursor user",
    power: "Power Cursor user",
  };
  return map[exp] ?? exp;
}

// ---------------------------------------------------------------------------
// Embeddings & Semantic Compatibility Matrix
// ---------------------------------------------------------------------------

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data.map((item) => item.embedding);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    nA += a[i] * a[i];
    nB += b[i] * b[i];
  }
  if (nA === 0 || nB === 0) return 0;
  return dot / (Math.sqrt(nA) * Math.sqrt(nB));
}

/**
 * Build a semantic compatibility matrix between all attendee pairs.
 * For each pair (A,B) we compute:
 *   - How well A's goals align with B's offers (would B help A?)
 *   - How well A's offers align with B's goals (would A help B?)
 * Returns sorted list of pair scores.
 */
async function buildCompatibilityMatrix(
  profiles: AttendeeProfile[]
): Promise<PairScore[]> {
  // Build a single embedding for each person's goals-blob and offers-blob
  const goalTexts = profiles.map(
    (p) => p.goals.join(", ") + (p.intent ? `. Intent: ${p.intent}` : "")
  );
  const offerTexts = profiles.map((p) => p.offers.join(", "));

  const [goalEmbeds, offerEmbeds] = await Promise.all([
    generateEmbeddings(goalTexts),
    generateEmbeddings(offerTexts),
  ]);

  const pairs: PairScore[] = [];
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const gToO = cosineSimilarity(goalEmbeds[i], offerEmbeds[j]); // A's goals ↔ B's offers
      const oToG = cosineSimilarity(offerEmbeds[i], goalEmbeds[j]); // A's offers ↔ B's goals
      pairs.push({
        a: profiles[i].id,
        b: profiles[j].id,
        goalToOfferSim: gToO,
        offerToGoalSim: oToG,
        avgSim: (gToO + oToG) / 2,
      });
    }
  }

  pairs.sort((x, y) => y.avgSim - x.avgSim);
  return pairs;
}

// ---------------------------------------------------------------------------
// Constraint checking (deterministic post-processing)
// ---------------------------------------------------------------------------

function checkConstraints(
  profiles: AttendeeProfile[],
  memberIds: string[]
): MatchConstraint[] {
  const constraints: MatchConstraint[] = [];
  const members = profiles.filter((p) => memberIds.includes(p.id));

  // Domain clustering
  const domains = new Map<string, number>();
  members.forEach((p) => {
    if (p.domain) domains.set(p.domain, (domains.get(p.domain) || 0) + 1);
  });
  domains.forEach((count, domain) => {
    if (count > 2) {
      constraints.push({ type: "domain", severity: "soft", value: { domain, count } });
    }
  });

  return constraints;
}

// ---------------------------------------------------------------------------
// Main: Intelligent Group Formation
// ---------------------------------------------------------------------------

export async function generateHybridGroupMatches(
  intakes: AttendeeIntake[]
): Promise<MatchingResult> {
  // ── 1. Build rich attendee profiles ─────────────────────────────────────
  const profiles: AttendeeProfile[] = intakes.map((intake) => ({
    id: intake.user_id,
    name: intake.user?.name || "Anonymous",
    email: intake.user?.email || null,
    goals: humanGoals(intake.goals, intake.goals_other),
    offers: humanOffers(intake.offers, intake.offers_other),
    roleCategory: intake.role_category ?? null,
    founderStage: intake.founder_stage ?? null,
    yearsExperience: intake.years_experience ?? null,
    cursorExperience: intake.cursor_experience ?? null,
    intent: intake.intent ?? null,
    domain: extractDomain(intake.user?.email),
    skipped: intake.skipped,
  }));

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // ── 2. Build semantic compatibility matrix ──────────────────────────────
  let compatibilityInsight = "";
  try {
    const pairs = await buildCompatibilityMatrix(profiles);
    // Summarise the top-N strongest compatibility pairs for the reasoning model
    const topPairs = pairs.slice(0, Math.min(pairs.length, profiles.length * 3));
    const nameOf = (id: string) => profileMap.get(id)?.name ?? id;

    compatibilityInsight = `
SEMANTIC COMPATIBILITY ANALYSIS (top connections):
${topPairs
  .map(
    (p) =>
      `  ${nameOf(p.a)} ↔ ${nameOf(p.b)}: ` +
      `goals→offers ${(p.goalToOfferSim * 100).toFixed(0)}%, ` +
      `offers→goals ${(p.offerToGoalSim * 100).toFixed(0)}%, ` +
      `avg ${(p.avgSim * 100).toFixed(0)}%`
  )
  .join("\n")}
`;
    console.log("[matching] Built compatibility matrix with", pairs.length, "pairs");
  } catch (err) {
    console.warn("[matching] Embedding matrix failed, proceeding without:", err);
    compatibilityInsight =
      "\n(Semantic compatibility data unavailable — rely on stated goals/offers.)\n";
  }

  // ── 3. Build rich attendee dossiers for the reasoning model ─────────────
  const targetGroupSize = 5;
  const targetGroupCount = Math.max(1, Math.ceil(profiles.length / targetGroupSize));

  const dossiers = profiles.map((p) => {
    const parts: string[] = [`[${p.name}] (id: ${p.id})`];
    parts.push(`  Goals: ${p.goals.join(", ")}`);
    parts.push(`  Offers: ${p.offers.join(", ")}`);
    if (p.roleCategory) parts.push(`  Role: ${roleLabel(p.roleCategory)}`);
    if (p.founderStage) parts.push(`  Founder Stage: ${founderLabel(p.founderStage)}`);
    if (p.yearsExperience != null) parts.push(`  Experience: ${p.yearsExperience} years`);
    if (p.cursorExperience) parts.push(`  Cursor: ${cursorLabel(p.cursorExperience)}`);
    if (p.intent) parts.push(`  Intent: ${p.intent}`);
    if (p.domain) parts.push(`  Email Domain: ${p.domain}`);
    if (p.skipped) parts.push(`  (Skipped intake — limited info)`);
    return parts.join("\n");
  });

  // ── 4. Call reasoning model for intelligent group formation ─────────────
  const systemPrompt = `You are an expert networking event facilitator and group dynamics specialist. Your job is to create the BEST possible seating arrangement at a tech meetup so that every person at every table has someone they can meaningfully connect with.

You will receive:
1. Detailed attendee profiles (goals, offers, role, experience, intent)
2. A semantic compatibility matrix showing the strongest goal↔offer alignment pairs

Your task: form ${targetGroupCount} table groups of ~${targetGroupSize} people (max 6) that maximize value for every attendee.

MATCHING PHILOSOPHY:
- The #1 priority is that each person has at least one strong connection at their table
- A "strong connection" = someone whose OFFERS directly address their GOALS, or vice versa
- Complementary > similar: a founder seeking funding + an investor is better than two founders seeking funding
- Mix experience levels when possible: pair mentors with learners, experienced with curious
- Founders at similar stages can also bond, but pair them with someone who offers what they need
- People who skipped intake should be distributed evenly, not clustered together
- Avoid 3+ people from the same email domain at the same table
- For people with "intent" text, treat that as their strongest signal for matching

RESPONSE FORMAT — respond with ONLY this JSON, no markdown:
{
  "groups": [
    {
      "name": "Creative theme name for this table",
      "description": "2-3 sentences: Why these people belong together. What value exchange is happening here.",
      "memberIds": ["id1", "id2", "id3", "id4", "id5"],
      "matchReasons": {
        "id1": "Specific reason: who at this table helps them and how, referencing names",
        "id2": "Specific reason: who at this table helps them and how, referencing names"
      }
    }
  ]
}

CRITICAL RULES FOR matchReasons:
- Each reason MUST reference at least one other person BY NAME at the table
- Each reason MUST connect to this person's stated goals OR offers
- Never use generic text like "complementary networking opportunities"
- Keep each reason to 1-2 concise sentences
- For skipped-intake people: mention who at the table covers the broadest range of topics`;

  const userPrompt = `ATTENDEE PROFILES (${profiles.length} people → ${targetGroupCount} tables of ~${targetGroupSize}):

${dossiers.join("\n\n")}

${compatibilityInsight}

Now create the optimal seating arrangement. Remember: every person needs a specific, named reason for being at their table. Use the compatibility data to inform your grouping decisions.`;

  const openai = getOpenAIClient();
  let aiGroups: Array<{
    name: string;
    description: string;
    memberIds: string[];
    matchReasons: Record<string, string>;
  }>;

  try {
    console.log("[matching] Calling reasoning model for group formation...");
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: "o4-mini",
      reasoning_effort: "high",
      messages: [
        { role: "developer", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_output_tokens: 16000,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[matching] Reasoning model responded in ${elapsed}ms`);

    const responseText = completion.choices[0]?.message?.content || "";

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in reasoning model response");
      parsed = JSON.parse(jsonMatch[0]);
    }

    aiGroups = parsed.groups || [];
    console.log("[matching] Reasoning model produced", aiGroups.length, "groups");
  } catch (error) {
    console.error("[matching] Reasoning model failed, falling back to gpt-4o-mini:", error);
    aiGroups = await fallbackGrouping(profiles, targetGroupCount, targetGroupSize, compatibilityInsight, dossiers);
  }

  // ── 5. Deterministic post-processing ────────────────────────────────────
  // Ensure uniqueness, handle missed attendees, enforce size constraints
  const assignedGlobal = new Set<string>();
  const validGroups: typeof aiGroups = [];

  for (const group of aiGroups) {
    const uniqueIds = Array.from(new Set(group.memberIds)).filter(
      (id) => !assignedGlobal.has(id) && profileMap.has(id)
    );
    if (uniqueIds.length > 0) {
      validGroups.push({ ...group, memberIds: uniqueIds });
      uniqueIds.forEach((id) => assignedGlobal.add(id));
    }
  }

  // Distribute missed attendees
  const missed = profiles.filter((p) => !assignedGlobal.has(p.id));
  if (missed.length > 0) {
    console.log(`[matching] Distributing ${missed.length} missed attendees`);
    for (const p of missed) {
      // Prefer groups under 5, then under 6
      let candidates = validGroups.filter((g) => g.memberIds.length < 5);
      if (candidates.length === 0)
        candidates = validGroups.filter((g) => g.memberIds.length < 6);

      if (candidates.length > 0) {
        const target = candidates.reduce((prev, curr) =>
          prev.memberIds.length <= curr.memberIds.length ? prev : curr
        );
        target.memberIds.push(p.id);
        target.matchReasons[p.id] =
          `Joined this table to connect with ${target.memberIds
            .slice(0, 2)
            .map((id) => profileMap.get(id)?.name ?? "a fellow attendee")
            .join(" and ")} who cover a range of topics relevant to their interests`;
      } else {
        validGroups.push({
          name: `Overflow Table ${validGroups.length + 1}`,
          description: "Additional attendees assigned when all tables reached capacity",
          memberIds: [p.id],
          matchReasons: {
            [p.id]: "Assigned to overflow seating — will be joined by others as capacity allows",
          },
        });
      }
      assignedGlobal.add(p.id);
    }
  }

  // Split oversized groups (>6)
  const sizedGroups: typeof validGroups = [];
  for (const group of validGroups) {
    if (group.memberIds.length <= 6) {
      sizedGroups.push(group);
    } else {
      const members = [...group.memberIds];
      let chunk = 0;
      while (members.length > 0) {
        const slice = members.splice(0, 6);
        const reasons: Record<string, string> = {};
        slice.forEach((id) => {
          reasons[id] = group.matchReasons[id] ?? "Part of a split table — see group theme";
        });
        sizedGroups.push({
          name: chunk === 0 ? group.name : `${group.name} (${chunk + 1})`,
          description: group.description,
          memberIds: slice,
          matchReasons: reasons,
        });
        chunk++;
      }
    }
  }

  // ── 6. Score groups and build final output ──────────────────────────────
  const results: MatchingResult["groups"] = [];

  for (const group of sizedGroups) {
    const constraints = checkConstraints(profiles, group.memberIds);
    const score = scoreGroup(profiles, group.memberIds, constraints);

    results.push({
      name: group.name,
      description: group.description,
      memberIds: group.memberIds,
      matchReasons: group.matchReasons,
      score: Math.round(score * 100) / 100,
      constraints,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return { groups: results };
}

// ---------------------------------------------------------------------------
// Scoring (deterministic, no API calls)
// ---------------------------------------------------------------------------

function scoreGroup(
  profiles: AttendeeProfile[],
  memberIds: string[],
  constraints: MatchConstraint[]
): number {
  const members = profiles.filter((p) => memberIds.includes(p.id));
  let score = 80; // base

  // Penalty for constraint violations
  for (const c of constraints) {
    score -= c.severity === "hard" ? 30 : 10;
  }

  // Reward role diversity
  const roles = new Set(members.map((m) => m.roleCategory).filter(Boolean));
  score += Math.min(roles.size * 5, 15);

  // Reward experience spread
  const exps = members.map((m) => m.yearsExperience).filter((e): e is number => e != null);
  if (exps.length >= 2) {
    const spread = Math.max(...exps) - Math.min(...exps);
    score += Math.min(spread, 10);
  }

  // Reward having both goals and offers coverage
  const allGoals = new Set(members.flatMap((m) => m.goals));
  const allOffers = new Set(members.flatMap((m) => m.offers));
  score += Math.min(allGoals.size + allOffers.size, 15);

  // Group size preference
  const sz = members.length;
  if (sz === 5) score += 10;
  else if (sz === 6) score += 5;
  else if (sz === 4) score += 3;
  else if (sz < 3 || sz > 6) score -= 15;

  // Penalty for too many skipped-intake members
  const skippedCount = members.filter((m) => m.skipped).length;
  if (skippedCount > 2) score -= (skippedCount - 2) * 5;

  return Math.max(0, Math.min(100, score));
}

// ---------------------------------------------------------------------------
// Fallback: gpt-4o-mini if reasoning model fails
// ---------------------------------------------------------------------------

async function fallbackGrouping(
  profiles: AttendeeProfile[],
  targetGroupCount: number,
  targetGroupSize: number,
  compatibilityInsight: string,
  dossiers: string[]
): Promise<
  Array<{
    name: string;
    description: string;
    memberIds: string[];
    matchReasons: Record<string, string>;
  }>
> {
  const openai = getOpenAIClient();
  const prompt = `Create ${targetGroupCount} networking groups of ~${targetGroupSize} people (max 6). Match people whose OFFERS align with others' GOALS. Every attendee in exactly one group.

ATTENDEES:
${dossiers.join("\n\n")}

${compatibilityInsight}

Respond ONLY with valid JSON:
{
  "groups": [
    {
      "name": "Theme",
      "description": "Why matched",
      "memberIds": ["id1","id2","id3","id4","id5"],
      "matchReasons": {
        "id1": "Specific reason referencing other members by name",
        "id2": "Specific reason referencing other members by name"
      }
    }
  ]
}

CRITICAL: Each matchReason MUST name specific people at the table. Never use generic text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert networking facilitator. Always respond with valid JSON only. Every matchReason must reference specific people by name.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const text = completion.choices[0]?.message?.content || "";
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in fallback response");
      parsed = JSON.parse(match[0]);
    }
    return parsed.groups || [];
  } catch (err) {
    console.error("[matching] Fallback also failed, using random grouping:", err);
    // Last resort: random groups
    const groups: Array<{
      name: string;
      description: string;
      memberIds: string[];
      matchReasons: Record<string, string>;
    }> = [];
    const remaining = [...profiles];
    let idx = 1;
    while (remaining.length > 0) {
      const chunk = remaining.splice(0, targetGroupSize);
      const reasons: Record<string, string> = {};
      chunk.forEach((p) => {
        const others = chunk.filter((o) => o.id !== p.id);
        reasons[p.id] = `Seated with ${others.map((o) => o.name).join(", ")} for networking`;
      });
      groups.push({
        name: `Table ${idx}`,
        description: "Networking table",
        memberIds: chunk.map((p) => p.id),
        matchReasons: reasons,
      });
      idx++;
    }
    return groups;
  }
}
