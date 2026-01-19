import { createClient, createServiceClient } from "./server";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import type {
  Event,
  User,
  UserRole,
  Registration,
  AgendaItem,
  Announcement,
  Question,
  Answer,
  Survey,
  SurveyResponse,
  AttendeeIntake,
  SuggestedGroup,
  DisplayPageData,
  Poll,
  PollVote,
  PollWithVotes,
  SlideDeck,
} from "@/types";

// Event queries
export async function getEventBySlug(slug: string): Promise<Event | null> {
  console.log("[getEventBySlug] Looking for event with slug:", slug);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  console.log("[getEventBySlug] SUPABASE_URL:", url);
  console.log("[getEventBySlug] ANON_KEY prefix:", anonKey.substring(0, 25));
  console.log("[getEventBySlug] ANON_KEY length:", anonKey.length);

  // Try direct client to bypass @supabase/ssr
  try {
    console.log("[getEventBySlug] Trying DIRECT client...");
    const directSupabase = createDirectClient(url, anonKey);
    const { data: directData, error: directError } = await directSupabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();

    if (directError) {
      console.error("[getEventBySlug] DIRECT client error:", directError.message, directError.code);
    } else {
      console.log("[getEventBySlug] DIRECT client SUCCESS! Event:", directData?.id);
      return directData;
    }
  } catch (err) {
    console.error("[getEventBySlug] DIRECT client exception:", err);
  }

  // Fallback to SSR client
  try {
    console.log("[getEventBySlug] Trying SSR client...");
    const supabase = await createClient();
    console.log("[getEventBySlug] SSR client created");
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("[getEventBySlug] SSR client error:", error.message, error.code);
      return null;
    }
    console.log("[getEventBySlug] SSR client found event:", data?.id);
    return data;
  } catch (err) {
    console.error("[getEventBySlug] SSR client exception:", err);
    return null;
  }
}

export async function getEventStats(eventId: string) {
  const supabase = await createClient();

  const [registrationsResult, checkedInResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("id", { count: "exact" })
      .eq("event_id", eventId),
    supabase
      .from("registrations")
      .select("id", { count: "exact" })
      .eq("event_id", eventId)
      .not("checked_in_at", "is", null),
  ]);

  return {
    registered: registrationsResult.count || 0,
    checkedIn: checkedInResult.count || 0,
  };
}

// User queries
export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) return null;
  return data;
}

// Registration queries
export async function getRegistration(
  eventId: string,
  userId: string
): Promise<Registration | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*, user:users(*)")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function getEventRegistrations(
  eventId: string
): Promise<Registration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*, user:users(*, intakes:attendee_intakes(*))")
    .eq("event_id", eventId)
    .eq("user.intakes.event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getEventRegistrations] Error:", error);
    return [];
  }
  return data;
}

export async function searchRegistrations(
  eventId: string,
  query: string
): Promise<Registration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*, user:users(*, intakes:attendee_intakes(*))")
    .eq("event_id", eventId)
    .eq("user.intakes.event_id", eventId)
    .or(`user.name.ilike.%${query}%,user.email.ilike.%${query}%`);

  if (error) return [];
  return data;
}

// Get registered attendees for check-in
export async function getEventAttendees(
  eventId: string
): Promise<{ id: string; name: string; email: string | null }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("user:users(id, name, email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  
  // Flatten the nested user object
  return data
    .filter((r) => r.user)
    .map((r) => {
      // Handle both array and object cases from Supabase
      const user = Array.isArray(r.user) ? r.user[0] : r.user;
      if (!user || typeof user !== 'object') return null;
      
      return {
        id: String(user.id),
        name: String(user.name),
        email: user.email ? String(user.email) : null,
      };
    })
    .filter((user): user is { id: string; name: string; email: string | null } => user !== null);
}

// Agenda queries
export async function getAgendaItems(eventId: string): Promise<AgendaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agenda_items")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data;
}

// Announcement queries
export async function getAnnouncements(eventId: string): Promise<Announcement[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("event_id", eventId)
    .not("published_at", "is", null)
    .or(`expires_at.is.null,expires_at.gt.${now}`) // Only get announcements that haven't expired
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) return [];
  return data;
}

// Question queries
// Calculate a "hot score" for trending questions
// Formula: (upvotes * 2 + answers_count * 1.5) / (hours_since_creation + 2)^1.5
// This gives a boost to recent questions and those with engagement
function calculateHotScore(question: Question): number {
  const upvotes = question.upvotes || 0;
  const answersCount = question.answers?.length || 0;
  const createdAt = new Date(question.created_at);
  const now = new Date();
  const hoursSinceCreation = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
  
  // Hot score: engagement weighted by recency
  const engagement = upvotes * 2 + answersCount * 1.5;
  const timeDecay = Math.pow(hoursSinceCreation + 2, 1.5);
  return engagement / timeDecay;
}

export async function getQuestions(
  eventId: string,
  sort: "trending" | "new" = "trending",
  includeHidden: boolean = false
): Promise<Question[]> {
  const supabase = await createClient();
  // Explicitly specify the relationship to avoid ambiguity with question_upvotes
  const query = supabase
    .from("questions")
    .select("*, user:users!questions_user_id_fkey(*), answers(*, user:users!answers_user_id_fkey(*))")
    .eq("event_id", eventId);

  if (!includeHidden) {
    query.neq("status", "hidden");
  }

  // For "new", just order by created_at
  if (sort === "new") {
    query.order("created_at", { ascending: false });
  } else {
    // For "trending", fetch all and sort by hot score
    query.order("created_at", { ascending: false }); // Get all first
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getQuestions] Error fetching questions:", error);
    return [];
  }

  // If trending, sort by hot score
  if (sort === "trending" && data) {
    return data.sort((a, b) => {
      const scoreA = calculateHotScore(a);
      const scoreB = calculateHotScore(b);
      return scoreB - scoreA; // Descending order
    });
  }

  return data || [];
}

// Admin version that bypasses RLS to see all questions
export async function getQuestionsForAdmin(
  eventId: string,
  sort: "trending" | "new" = "trending",
  includeHidden: boolean = true
): Promise<Question[]> {
  console.log("[getQuestionsForAdmin] Fetching questions for admin, eventId:", eventId);
  const supabase = await createServiceClient();
  // Explicitly specify the relationship to avoid ambiguity with question_upvotes
  const query = supabase
    .from("questions")
    .select("*, user:users!questions_user_id_fkey(*), answers(*, user:users!answers_user_id_fkey(*))")
    .eq("event_id", eventId);

  if (!includeHidden) {
    query.neq("status", "hidden");
  }

  // For "new", just order by created_at
  if (sort === "new") {
    query.order("created_at", { ascending: false });
  } else {
    // For "trending", fetch all and sort by hot score
    query.order("created_at", { ascending: false }); // Get all first
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getQuestionsForAdmin] Error fetching questions:", error);
    return [];
  }

  // If trending, sort by hot score
  if (sort === "trending" && data) {
    const sorted = data.sort((a, b) => {
      const scoreA = calculateHotScore(a);
      const scoreB = calculateHotScore(b);
      return scoreB - scoreA; // Descending order
    });
    console.log("[getQuestionsForAdmin] Found", sorted.length, "questions, sorted by hot score");
    return sorted;
  }

  console.log("[getQuestionsForAdmin] Found", data?.length || 0, "questions");
  return data || [];
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const supabase = await createClient();
  // Explicitly specify the relationship to avoid ambiguity with question_upvotes
  const { data, error } = await supabase
    .from("questions")
    .select("*, user:users!questions_user_id_fkey(*), answers(*, user:users!answers_user_id_fkey(*))")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

// Survey queries
export async function getPublishedSurvey(eventId: string): Promise<Survey | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("event_id", eventId)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getAllSurveys(eventId: string): Promise<Survey[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

// Intake queries
export async function getAttendeeIntake(
  eventId: string,
  userId: string
): Promise<AttendeeIntake | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendee_intakes")
    .select("*, user:users(*)")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function getEventIntakes(eventId: string): Promise<AttendeeIntake[]> {
  const supabase = await createServiceClient();

  // First get all checked-in registrations with user info
  const { data: checkedInRegs, error: checkedInError } = await supabase
    .from("registrations")
    .select("user_id, created_at, user:users(id, name, email, role, created_at)")
    .eq("event_id", eventId)
    .not("checked_in_at", "is", null)
    .order("created_at", { ascending: false });

  if (checkedInError) {
    console.error("[getEventIntakes] Error loading checked-in registrations:", checkedInError);
    return [];
  }

  const checkedInUsers = (checkedInRegs || [])
    .map((reg) => {
      const user = Array.isArray(reg.user) ? reg.user[0] : reg.user;
      if (!user || typeof user !== "object") return null;
      return {
        user_id: String(reg.user_id),
        created_at: String(reg.created_at),
        user: {
          id: String(user.id),
          name: String(user.name),
          email: user.email ? String(user.email) : null,
          role: user.role as UserRole,
          created_at: user.created_at ? String(user.created_at) : "",
        },
      };
    })
    .filter((reg) => reg !== null);

  if (checkedInUsers.length === 0) {
    return [];
  }

  const checkedInUserIds = checkedInUsers.map((reg) => reg.user_id);

  // Then get intakes for those users (include skipped and missing)
  const { data, error } = await supabase
    .from("attendee_intakes")
    .select("*")
    .eq("event_id", eventId)
    .in("user_id", checkedInUserIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getEventIntakes] Error:", error);
  }

  const intakeByUserId = new Map<string, AttendeeIntake>();
  (data || []).forEach((intake) => {
    intakeByUserId.set(intake.user_id, intake as AttendeeIntake);
  });

  return checkedInUsers.map((reg) => {
    const intake = intakeByUserId.get(reg.user_id);
    if (intake) {
      return {
        ...intake,
        user: reg.user,
      };
    }
    return {
      id: `missing-${reg.user_id}`,
      event_id: eventId,
      user_id: reg.user_id,
      goals: [],
      goals_other: null,
      offers: [],
      offers_other: null,
      skipped: true,
      created_at: reg.created_at,
      user: reg.user,
    };
  });
}

// Group queries
export async function getSuggestedGroups(eventId: string): Promise<SuggestedGroup[]> {
  // Use service client to bypass RLS since groups are created by service client
  const supabase = await createServiceClient();
  console.log("[getSuggestedGroups] Fetching groups for event:", eventId);

  const { data: checkedInRegs } = await supabase
    .from("registrations")
    .select("user_id")
    .eq("event_id", eventId)
    .not("checked_in_at", "is", null);

  const checkedInUserIds = new Set((checkedInRegs || []).map((reg) => reg.user_id));
  
  // Note: suggested_group_members has user_id FK to users, but NOT to attendee_intakes
  // So we only join users here
  const { data, error } = await supabase
    .from("suggested_groups")
    .select(`
      *,
      members:suggested_group_members(
        *,
        user:users(*)
      )
    `)
    .eq("event_id", eventId)
    .order("match_score", { ascending: false, nullsLast: true })
    .order("table_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getSuggestedGroups] Error fetching groups:", error);
    return [];
  }
  
  const filteredGroups = (data || [])
    .map((group: SuggestedGroup) => ({
      ...group,
      members: (group.members || []).filter((member) =>
        checkedInUserIds.has(member.user_id)
      ),
    }))
    .filter((group: SuggestedGroup) => (group.members || []).length > 0);

  console.log("[getSuggestedGroups] Found groups:", filteredGroups.length || 0);
  return filteredGroups;
}

// Slide deck queries
export async function getSlideDeck(eventId: string): Promise<SlideDeck | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("slide_decks")
    .select("*")
    .eq("event_id", eventId)
    .single();

  if (error) return null;
  return data;
}

// Display page data
export async function getDisplayPageData(eventId: string): Promise<DisplayPageData | null> {
  const supabase = await createClient();
  const now = new Date();

  const [eventResult, agendaResult, questionsResult, announcementsResult, deckResult] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).single(),
    supabase.from("agenda_items").select("*").eq("event_id", eventId).order("sort_order"),
    supabase
      .from("questions")
      .select("*, user:users(name)")
      .eq("event_id", eventId)
      .in("status", ["open", "pinned"])
      .order("upvotes", { ascending: false })
      .limit(10),
    supabase
      .from("announcements")
      .select("*")
      .eq("event_id", eventId)
      .not("published_at", "is", null)
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`) // Only get announcements that haven't expired
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("slide_decks")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_live", true)
      .single(),
  ]);

  if (eventResult.error || !eventResult.data) return null;

  const agendaItems = agendaResult.data || [];

  // Find current and next sessions
  let currentSession: AgendaItem | null = null;
  let nextSession: AgendaItem | null = null;

  for (const item of agendaItems) {
    if (item.start_time && item.end_time) {
      const start = new Date(item.start_time);
      const end = new Date(item.end_time);

      if (now >= start && now <= end) {
        currentSession = item;
      } else if (now < start && !nextSession) {
        nextSession = item;
      }
    }
  }

  return {
    event: eventResult.data,
    currentSession,
    nextSession,
    recentQuestions: questionsResult.data || [],
    announcements: announcementsResult.data || [],
    slideDeck: deckResult.data || null,
  };
}

// Poll queries
export async function getActivePolls(eventId: string): Promise<Poll[]> {
  const supabase = await createClient();
  
  // First, deactivate any expired polls
  const { deactivateExpiredPolls } = await import("@/lib/actions/polls");
  await deactivateExpiredPolls(eventId);
  
  const now = new Date().toISOString();
  // Query active polls that either have no end time or haven't ended yet
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .or(`ends_at.is.null,ends_at.gt."${now}"`) // Only include polls that haven't ended
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getAllPolls(eventId: string): Promise<Poll[]> {
  const supabase = await createClient();
  
  // First, deactivate any expired polls
  const { deactivateExpiredPolls } = await import("@/lib/actions/polls");
  await deactivateExpiredPolls(eventId);
  
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getPollWithVotes(
  pollId: string,
  userId?: string
): Promise<PollWithVotes | null> {
  const supabase = await createClient();

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) return null;

  const { data: votes } = await supabase
    .from("poll_votes")
    .select("*")
    .eq("poll_id", pollId);

  const allVotes = votes || [];
  const userVote = userId
    ? allVotes.find((v) => v.user_id === userId) || null
    : null;

  // Calculate vote counts for each option
  const optionsArray = poll.options as string[];
  const voteCounts = optionsArray.map(
    (_, index) => allVotes.filter((v) => v.option_index === index).length
  );

  return {
    ...poll,
    votes: allVotes,
    user_vote: userVote,
    vote_counts: voteCounts,
    total_votes: allVotes.length,
  };
}

export async function getActivePollsWithVotes(
  eventId: string,
  userId?: string
): Promise<PollWithVotes[]> {
  const supabase = await createClient();

  // First, deactivate any expired polls
  const { deactivateExpiredPolls } = await import("@/lib/actions/polls");
  await deactivateExpiredPolls(eventId);

  const now = new Date().toISOString();
  // Query active polls that either have no end time or haven't ended yet
  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .or(`ends_at.is.null,ends_at.gt."${now}"`) // Only include polls that haven't ended
    .order("created_at", { ascending: false });

  if (error || !polls) return [];

  const pollsWithVotes = await Promise.all(
    polls.map(async (poll) => {
      const { data: votes } = await supabase
        .from("poll_votes")
        .select("*")
        .eq("poll_id", poll.id);

      const allVotes = votes || [];
      const userVote = userId
        ? allVotes.find((v) => v.user_id === userId) || null
        : null;

      const optionsArray = poll.options as string[];
      const voteCounts = optionsArray.map(
        (_, index) => allVotes.filter((v) => v.option_index === index).length
      );

      return {
        ...poll,
        votes: allVotes,
        user_vote: userVote,
        vote_counts: voteCounts,
        total_votes: allVotes.length,
      };
    })
  );

  return pollsWithVotes;
}

// Analytics queries
export interface CheckInDataPoint {
  time: string; // ISO timestamp
  count: number;
  cumulative: number;
}

export interface QAAnalytics {
  mostUpvoted: Question[];
  unansweredAging: Array<{
    question: Question;
    ageMinutes: number;
  }>;
}

export interface PollParticipation {
  pollId: string;
  pollTitle: string;
  totalVotes: number;
  participationRate: number; // percentage of checked-in attendees
  checkedInCount: number;
}

export interface IntakeAnalytics {
  completionRate: number; // percentage
  dropOffRate: number; // percentage
  started: number;
  completed: number;
  skipped: number;
  total: number;
}

export async function getCheckInCurve(eventId: string): Promise<CheckInDataPoint[]> {
  const supabase = await createClient();
  
  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("checked_in_at, created_at")
    .eq("event_id", eventId)
    .not("checked_in_at", "is", null)
    .order("checked_in_at", { ascending: true });

  if (error || !registrations || registrations.length === 0) return [];

  // Group by hour
  const hourlyCounts = new Map<string, number>();
  
  registrations.forEach((reg) => {
    if (!reg.checked_in_at) return;
    const date = new Date(reg.checked_in_at);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const hourKey = `${date.getFullYear()}-${month}-${day}T${hour}:00:00`;
    
    hourlyCounts.set(hourKey, (hourlyCounts.get(hourKey) || 0) + 1);
  });

  // Convert to array, sort by time, and calculate cumulative
  const sortedEntries = Array.from(hourlyCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cumulative = 0;
  
  return sortedEntries.map(([time, count]) => {
    cumulative += count;
    return {
      time,
      count, // Count for this hour
      cumulative, // Total up to this hour
    };
  });
}

export async function getQAAnalytics(eventId: string): Promise<QAAnalytics> {
  const supabase = await createClient();
  
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*, user:users(name)")
    .eq("event_id", eventId)
    .order("upvotes", { ascending: false });

  if (error || !questions) {
    return { mostUpvoted: [], unansweredAging: [] };
  }

  const mostUpvoted = questions.slice(0, 10);
  
  const now = new Date();
  const unansweredAging = questions
    .filter((q) => q.status === "open")
    .map((q) => {
      const created = new Date(q.created_at);
      const ageMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
      return { question: q, ageMinutes };
    })
    .sort((a, b) => b.ageMinutes - a.ageMinutes);

  return { mostUpvoted, unansweredAging };
}

export async function getPollParticipation(eventId: string): Promise<PollParticipation[]> {
  const supabase = await createClient();
  
  // Get all polls
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("*")
    .eq("event_id", eventId);

  if (pollsError || !polls) return [];

  // Get checked-in count
  const { count: checkedInCount } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .not("checked_in_at", "is", null);

  const totalCheckedIn = checkedInCount || 0;

  // Get votes for each poll
  const participationData = await Promise.all(
    polls.map(async (poll) => {
      const { count: voteCount } = await supabase
        .from("poll_votes")
        .select("id", { count: "exact", head: true })
        .eq("poll_id", poll.id);

      const totalVotes = voteCount || 0;
      const participationRate = totalCheckedIn > 0 ? (totalVotes / totalCheckedIn) * 100 : 0;

      return {
        pollId: poll.id,
        pollTitle: poll.question,
        totalVotes,
        participationRate,
        checkedInCount: totalCheckedIn,
      };
    })
  );

  return participationData;
}

export async function getIntakeAnalytics(eventId: string): Promise<IntakeAnalytics> {
  const supabase = await createClient();
  
  // Get total registrations
  const { count: totalRegistrations } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const total = totalRegistrations || 0;

  // Get intakes
  const { data: intakes, error } = await supabase
    .from("attendee_intakes")
    .select("id, completed, skipped")
    .eq("event_id", eventId);

  if (error || !intakes) {
    return {
      completionRate: 0,
      dropOffRate: 0,
      started: 0,
      completed: 0,
      skipped: 0,
      total,
    };
  }

  const started = intakes.length;
  const completed = intakes.filter((i) => i.completed).length;
  const skipped = intakes.filter((i) => i.skipped).length;
  const notStarted = total - started;

  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  const dropOffRate = started > 0 ? ((started - completed - skipped) / started) * 100 : 0;

  return {
    completionRate,
    dropOffRate,
    started,
    completed,
    skipped,
    total,
  };
}
