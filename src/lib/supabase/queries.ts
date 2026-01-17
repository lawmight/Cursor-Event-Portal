import { createClient } from "./server";
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
} from "@/types";

// Event queries
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
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
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("event_id", eventId)
    .not("published_at", "is", null)
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) return [];
  return data;
}

// Question queries
export async function getQuestions(
  eventId: string,
  sort: "trending" | "new" = "trending"
): Promise<Question[]> {
  const supabase = await createClient();
  const query = supabase
    .from("questions")
    .select("*, user:users(*), answers(*)")
    .eq("event_id", eventId)
    .neq("status", "hidden");

  if (sort === "trending") {
    query.order("upvotes", { ascending: false });
  } else {
    query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) return [];
  return data;
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
    .single();

  if (error) return null;
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

// Display page data
export async function getDisplayPageData(eventId: string): Promise<DisplayPageData | null> {
  const supabase = await createClient();

  const [eventResult, agendaResult, questionsResult, announcementsResult] = await Promise.all([
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
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  if (eventResult.error || !eventResult.data) return null;

  const now = new Date();
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
  };
}
