"use server";

import OpenAI from "openai";
import type { AttendeeIntake } from "@/types";

interface AttendeeProfile {
  id: string;
  name: string;
  email: string | null;
  goals: string[];
  offers: string[];
  company?: string;
  domain?: string; // Email domain
}

interface MatchConstraint {
  type: "company" | "domain" | "mutual_benefit" | "dominator";
  severity: "hard" | "soft";
  value: any;
}

interface GroupMatch {
  memberIds: string[];
  score: number;
  constraints: MatchConstraint[];
  mutualBenefitEdges: Array<{ from: string; to: string; reason: string }>;
  rationale: string;
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

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

// Extract domain from email
function extractDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const match = email.match(/@(.+)/);
  return match ? match[1].toLowerCase() : null;
}

// Generate embeddings for goals/offers
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  
  return response.data.map((item) => item.embedding);
}

// Calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Check constraints for a potential group
function checkConstraints(
  profiles: AttendeeProfile[],
  memberIds: string[],
  existingGroupCounts: Map<string, number>,
  maxGroupsPerPerson: number = 1
): MatchConstraint[] {
  const constraints: MatchConstraint[] = [];
  const memberProfiles = profiles.filter((p) => memberIds.includes(p.id));
  
  // Check for same company/domain clustering
  const companies = new Map<string, number>();
  const domains = new Map<string, number>();
  
  memberProfiles.forEach((profile) => {
    if (profile.company) {
      companies.set(profile.company, (companies.get(profile.company) || 0) + 1);
    }
    if (profile.domain) {
      domains.set(profile.domain, (domains.get(profile.domain) || 0) + 1);
    }
  });
  
  // Soft constraint: more than 2 people from same company
  companies.forEach((count, company) => {
    if (count > 2) {
      constraints.push({
        type: "company",
        severity: "soft",
        value: { company, count },
      });
    }
  });
  
  // Soft constraint: more than 2 people from same domain
  domains.forEach((count, domain) => {
    if (count > 2) {
      constraints.push({
        type: "domain",
        severity: "soft",
        value: { domain, count },
      });
    }
  });
  
  // Check for mutual benefit edges
  let mutualBenefitCount = 0;
  for (let i = 0; i < memberProfiles.length; i++) {
    for (let j = i + 1; j < memberProfiles.length; j++) {
      const p1 = memberProfiles[i];
      const p2 = memberProfiles[j];
      
      // Check if p1's offers match p2's goals or vice versa
      const p1OffersMatchP2Goals = p1.offers.some((offer) =>
        p2.goals.some((goal) => offer.toLowerCase().includes(goal.toLowerCase()) || goal.toLowerCase().includes(offer.toLowerCase()))
      );
      const p2OffersMatchP1Goals = p2.offers.some((offer) =>
        p1.goals.some((goal) => offer.toLowerCase().includes(goal.toLowerCase()) || goal.toLowerCase().includes(offer.toLowerCase()))
      );
      
      if (p1OffersMatchP2Goals || p2OffersMatchP1Goals) {
        mutualBenefitCount++;
      }
    }
  }
  
  // Hard constraint: need at least some mutual benefit connections
  const minMutualBenefits = Math.floor(memberProfiles.length / 2);
  if (mutualBenefitCount < minMutualBenefits) {
    constraints.push({
      type: "mutual_benefit",
      severity: "hard",
      value: { count: mutualBenefitCount, required: minMutualBenefits },
    });
  }
  
  // Check for dominators (people in too many groups)
  memberIds.forEach((userId) => {
    const currentCount = existingGroupCounts.get(userId) || 0;
    if (currentCount >= maxGroupsPerPerson) {
      constraints.push({
        type: "dominator",
        severity: "hard",
        value: { userId, count: currentCount, max: maxGroupsPerPerson },
      });
    }
  });
  
  return constraints;
}

// Calculate match score for a group
async function calculateGroupScore(
  profiles: AttendeeProfile[],
  memberIds: string[],
  constraints: MatchConstraint[]
): Promise<number> {
  const memberProfiles = profiles.filter((p) => memberIds.includes(p.id));
  
  // Base score starts at 100
  let score = 100;
  
  // Penalize for constraint violations
  constraints.forEach((constraint) => {
    if (constraint.severity === "hard") {
      score -= 30; // Heavy penalty for hard constraints
    } else if (constraint.severity === "soft") {
      score -= 10; // Light penalty for soft constraints
    }
  });
  
  // Calculate mutual benefit score using embeddings
  try {
    const allGoals = memberProfiles.flatMap((p) => p.goals);
    const allOffers = memberProfiles.flatMap((p) => p.offers);
    
    if (allGoals.length > 0 && allOffers.length > 0) {
      const [goalEmbeddings, offerEmbeddings] = await Promise.all([
        generateEmbeddings(allGoals),
        generateEmbeddings(allOffers),
      ]);
      
      // Find best matches between offers and goals
      let bestMatches = 0;
      for (let i = 0; i < offerEmbeddings.length; i++) {
        let bestSimilarity = 0;
        for (let j = 0; j < goalEmbeddings.length; j++) {
          const similarity = cosineSimilarity(offerEmbeddings[i], goalEmbeddings[j]);
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
          }
        }
        if (bestSimilarity > 0.3) {
          // Threshold for meaningful match
          bestMatches++;
        }
      }
      
      // Boost score based on good matches
      const matchRatio = bestMatches / Math.max(allOffers.length, 1);
      score += matchRatio * 40; // Up to +40 points for good matches
    }
  } catch (error) {
    console.error("[calculateGroupScore] Error calculating embeddings:", error);
    // Fallback: use simple text matching
    let mutualBenefitCount = 0;
    for (let i = 0; i < memberProfiles.length; i++) {
      for (let j = i + 1; j < memberProfiles.length; j++) {
        const p1 = memberProfiles[i];
        const p2 = memberProfiles[j];
        
        const hasMatch = p1.offers.some((offer) =>
          p2.goals.some((goal) => offer.toLowerCase().includes(goal.toLowerCase()) || goal.toLowerCase().includes(offer.toLowerCase()))
        ) || p2.offers.some((offer) =>
          p1.goals.some((goal) => offer.toLowerCase().includes(goal.toLowerCase()) || goal.toLowerCase().includes(offer.toLowerCase()))
        );
        
        if (hasMatch) mutualBenefitCount++;
      }
    }
    
    const matchRatio = mutualBenefitCount / Math.max((memberProfiles.length * (memberProfiles.length - 1)) / 2, 1);
    score += matchRatio * 30;
  }
  
  // Bonus for group size (prefer 3-5 people)
  const groupSize = memberProfiles.length;
  if (groupSize >= 3 && groupSize <= 5) {
    score += 10;
  } else if (groupSize < 3 || groupSize > 6) {
    score -= 20;
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Generate structured rationale from constraints and matches
function generateStructuredRationale(
  profiles: AttendeeProfile[],
  memberIds: string[],
  constraints: MatchConstraint[],
  mutualBenefitEdges: Array<{ from: string; to: string; reason: string }>
): Record<string, string> {
  const memberProfiles = profiles.filter((p) => memberIds.includes(p.id));
  const profileMap = new Map(memberProfiles.map((p) => [p.id, p]));
  
  const matchReasons: Record<string, string> = {};
  
  memberIds.forEach((userId) => {
    const profile = profileMap.get(userId);
    if (!profile) return;
    
    const connections: string[] = [];
    
    // Find people whose offers match this person's goals
    memberIds.forEach((otherId) => {
      if (otherId === userId) return;
      const otherProfile = profileMap.get(otherId);
      if (!otherProfile) return;
      
      const matchingOffers = otherProfile.offers.filter((offer) =>
        profile.goals.some((goal) =>
          offer.toLowerCase().includes(goal.toLowerCase()) || goal.toLowerCase().includes(offer.toLowerCase())
        )
      );
      
      if (matchingOffers.length > 0) {
        connections.push(`${otherProfile.name} (offers: ${matchingOffers.join(", ")})`);
      }
    });
    
    if (connections.length > 0) {
      matchReasons[userId] = `Can benefit from meeting ${connections.join(" and ")} based on their goals: ${profile.goals.join(", ")}`;
    } else {
      matchReasons[userId] = `Placed in this group for complementary networking opportunities`;
    }
  });
  
  return matchReasons;
}

// Main matching function with hybrid approach
export async function generateHybridGroupMatches(
  intakes: AttendeeIntake[]
): Promise<MatchingResult> {
  // Build attendee profiles
  const profiles: AttendeeProfile[] = intakes.map((intake) => {
    const profile: AttendeeProfile = {
      id: intake.user_id,
      name: intake.user?.name || "Anonymous",
      email: intake.user?.email || null,
      goals: [...intake.goals, intake.goals_other].filter((g): g is string => typeof g === "string" && g !== null),
      offers: [...intake.offers, intake.offers_other].filter((o): o is string => typeof o === "string" && o !== null),
      domain: extractDomain(intake.user?.email) ?? undefined,
    };
    // Company could be extracted from user profile if available
    return profile;
  });
  
  // Track how many groups each person is in
  const groupCounts = new Map<string, number>();
  
  // Use LLM for initial grouping, then refine with constraints
  const openai = getOpenAIClient();
  const targetGroupSize = Math.min(5, Math.max(3, Math.ceil(profiles.length / 3)));
  
  const attendeeSummaries = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    goals: p.goals.length > 0 ? p.goals : ["general networking"],
    offers: p.offers.length > 0 ? p.offers : ["open to connect"],
  }));
  
  const prompt = `Create ${Math.ceil(profiles.length / targetGroupSize)} groups of ${targetGroupSize}-${targetGroupSize + 1} people for networking.

Attendees:
${JSON.stringify(attendeeSummaries, null, 2)}

Rules:
1. Match people whose OFFERS align with others' GOALS
2. Avoid putting too many people from the same company/domain together (max 2 per group)
3. Ensure diversity of skills in each group
4. Create groups that enable mutual value exchange
5. Every attendee should be in exactly one group

Respond ONLY with valid JSON:
{
  "groups": [
    {
      "name": "Group theme",
      "description": "Why matched",
      "memberIds": ["id1", "id2", "id3"]
    }
  ]
}`;
  
  let llmGroups: Array<{ name: string; description: string; memberIds: string[] }>;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert networking facilitator. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const responseText = completion.choices[0]?.message?.content || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse LLM response");
    
    const result = JSON.parse(jsonMatch[0]);
    llmGroups = result.groups || [];
  } catch (error) {
    console.error("[generateHybridGroupMatches] LLM error, using fallback:", error);
    // Fallback: simple grouping
    llmGroups = [];
    for (let i = 0; i < profiles.length; i += targetGroupSize) {
      llmGroups.push({
        name: `Group ${Math.floor(i / targetGroupSize) + 1}`,
        description: "Networking group",
        memberIds: profiles.slice(i, i + targetGroupSize).map((p) => p.id),
      });
    }
  }
  
  // Refine groups with constraints and scoring
  const refinedGroups = await Promise.all(
    llmGroups.map(async (group) => {
      const constraints = checkConstraints(profiles, group.memberIds, groupCounts);
      
      // Filter out groups with hard constraint violations
      const hasHardViolation = constraints.some((c) => c.severity === "hard" && c.type !== "mutual_benefit");
      if (hasHardViolation) {
        // Try to fix by removing problematic members
        const fixedMemberIds = group.memberIds.filter((id) => {
          const constraint = constraints.find((c) => c.type === "dominator" && c.value?.userId === id);
          return !constraint;
        });
        
        if (fixedMemberIds.length >= 2) {
          group.memberIds = fixedMemberIds;
        }
      }
      
      // Re-check constraints after fixes
      const finalConstraints = checkConstraints(profiles, group.memberIds, groupCounts);
      const score = await calculateGroupScore(profiles, group.memberIds, finalConstraints);
      
      // Update group counts
      group.memberIds.forEach((id) => {
        groupCounts.set(id, (groupCounts.get(id) || 0) + 1);
      });
      
      // Generate mutual benefit edges
      const memberProfiles = profiles.filter((p) => group.memberIds.includes(p.id));
      const mutualBenefitEdges: Array<{ from: string; to: string; reason: string }> = [];
      
      for (let i = 0; i < memberProfiles.length; i++) {
        for (let j = i + 1; j < memberProfiles.length; j++) {
          const p1 = memberProfiles[i];
          const p2 = memberProfiles[j];
          
          const p1OffersMatchP2Goals = p1.offers.filter((offer) =>
            p2.goals.some((goal) => offer.toLowerCase().includes(goal.toLowerCase()) || goal.toLowerCase().includes(offer.toLowerCase()))
          );
          const p2OffersMatchP1Goals = p2.offers.filter((offer) =>
            p1.goals.some((goal) => offer.toLowerCase().includes(goal.toLowerCase()) || goal.toLowerCase().includes(offer.toLowerCase()))
          );
          
          if (p1OffersMatchP2Goals.length > 0) {
            mutualBenefitEdges.push({
              from: p1.id,
              to: p2.id,
              reason: `${p1.name} offers ${p1OffersMatchP2Goals.join(", ")} which matches ${p2.name}'s goals`,
            });
          }
          if (p2OffersMatchP1Goals.length > 0) {
            mutualBenefitEdges.push({
              from: p2.id,
              to: p1.id,
              reason: `${p2.name} offers ${p2OffersMatchP1Goals.join(", ")} which matches ${p1.name}'s goals`,
            });
          }
        }
      }
      
      // Generate structured rationale
      const matchReasons = generateStructuredRationale(
        profiles,
        group.memberIds,
        finalConstraints,
        mutualBenefitEdges
      );
      
      return {
        name: group.name,
        description: group.description,
        memberIds: group.memberIds,
        matchReasons,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        constraints: finalConstraints,
      };
    })
  );
  
  // Sort by score descending
  refinedGroups.sort((a, b) => b.score - a.score);
  
  return { groups: refinedGroups };
}
