import { createClient, createServiceClient } from "./server";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import type {
  Event,
  User,
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
  Slide,
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
    .select("*, user:users(*)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function searchRegistrations(
  eventId: string,
  query: string
): Promise<Registration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*, user:users(*)")
    .eq("event_id", eventId)
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
export async function getQuestions(
  eventId: string,
  sort: "trending" | "new" = "trending",
  includeHidden: boolean = false
): Promise<Question[]> {
  const supabase = await createClient();
  const query = supabase
    .from("questions")
    .select("*, user:users(*), answers(*, user:users(*))")
    .eq("event_id", eventId);

  if (!includeHidden) {
    query.neq("status", "hidden");
  }

  if (sort === "trending") {
    query.order("upvotes", { ascending: false });
  } else {
    query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getQuestions] Error fetching questions:", error);
    return [];
  }
  return data;
}

// Admin version that bypasses RLS to see all questions
export async function getQuestionsForAdmin(
  eventId: string,
  sort: "trending" | "new" = "trending",
  includeHidden: boolean = true
): Promise<Question[]> {
  console.log("[getQuestionsForAdmin] Fetching questions for admin, eventId:", eventId);
  const supabase = await createServiceClient();
  const query = supabase
    .from("questions")
    .select("*, user:users(*), answers(*, user:users(*))")
    .eq("event_id", eventId);

  if (!includeHidden) {
    query.neq("status", "hidden");
  }

  if (sort === "trending") {
    query.order("upvotes", { ascending: false });
  } else {
    query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getQuestionsForAdmin] Error fetching questions:", error);
    return [];
  }
  console.log("[getQuestionsForAdmin] Found", data?.length || 0, "questions");
  return data || [];
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*, user:users(*), answers(*, user:users(*))")
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendee_intakes")
    .select("*, user:users(*)")
    .eq("event_id", eventId)
    .eq("skipped", false)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

// Group queries
export async function getSuggestedGroups(eventId: string): Promise<SuggestedGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suggested_groups")
    .select(`
      *,
      members:suggested_group_members(
        *,
        user:users(*),
        intake:attendee_intakes(*)
      )
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

// Slide queries
export async function getSlides(eventId: string): Promise<Slide[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data;
}

export async function getLiveSlide(eventId: string): Promise<Slide | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("slides")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_live", true)
    .single();

  if (error) return null;
  return data;
}

// Display page data
export async function getDisplayPageData(eventId: string): Promise<DisplayPageData | null> {
  const supabase = await createClient();
  const now = new Date();

  const [eventResult, agendaResult, questionsResult, announcementsResult, slidesResult] = await Promise.all([
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
      .from("slides")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
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
    slides: slidesResult.data || [],
  };
}

// Poll queries
export async function getActivePolls(eventId: string): Promise<Poll[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getAllPolls(eventId: string): Promise<Poll[]> {
  const supabase = await createClient();
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

  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
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
