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
    .map((r) => ({
      id: (r.user as { id: string; name: string; email: string | null }).id,
      name: (r.user as { id: string; name: string; email: string | null }).name,
      email: (r.user as { id: string; name: string; email: string | null }).email,
    }));
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
