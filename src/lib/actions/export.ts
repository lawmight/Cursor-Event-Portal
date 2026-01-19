"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";

export async function getDetailedAttendeeData(eventId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Check if user is admin
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    return { error: "Not authorized" };
  }

  // Get all registrations with user data
  const { data: registrations } = await supabase
    .from("registrations")
    .select("*, user:users(id, name, email, role)")
    .eq("event_id", eventId);

  if (!registrations) {
    return { error: "Failed to fetch registrations" };
  }

  const userIds = registrations
    .map((r) => {
      const user = Array.isArray(r.user) ? r.user[0] : r.user;
      return user?.id;
    })
    .filter(Boolean) as string[];

  // Fetch all intakes
  const { data: intakes } = await supabase
    .from("attendee_intakes")
    .select("*")
    .eq("event_id", eventId)
    .in("user_id", userIds);

  // Fetch all poll votes with poll info
  const { data: pollVotes } = await supabase
    .from("poll_votes")
    .select(`
      *,
      poll:polls(
        id,
        question,
        options,
        event_id
      )
    `)
    .in("user_id", userIds);

  // Filter poll votes to this event
  const eventPollVotes = (pollVotes || []).filter(
    (vote) => vote.poll && (vote.poll as any).event_id === eventId
  );

  // Fetch all questions
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("event_id", eventId)
    .in("user_id", userIds);

  // Fetch all answers
  const { data: answers } = await supabase
    .from("answers")
    .select(`
      *,
      question:questions(
        id,
        content,
        event_id
      )
    `)
    .in("user_id", userIds);

  // Filter answers to this event
  const eventAnswers = (answers || []).filter(
    (answer) => answer.question && (answer.question as any).event_id === eventId
  );

  // Fetch all upvotes
  const { data: upvotes } = await supabase
    .from("question_upvotes")
    .select(`
      *,
      question:questions(
        id,
        content,
        event_id
      )
    `)
    .in("user_id", userIds);

  // Filter upvotes to this event
  const eventUpvotes = (upvotes || []).filter(
    (upvote) => upvote.question && (upvote.question as any).event_id === eventId
  );

  // Build detailed data for each attendee
  const detailedData = registrations.map((reg) => {
    const user = Array.isArray(reg.user) ? reg.user[0] : reg.user;
    const userId = user?.id;
    
    const intake = intakes?.find((i) => i.user_id === userId);
    const userPollVotes = eventPollVotes.filter((v) => v.user_id === userId);
    const userQuestions = questions?.filter((q) => q.user_id === userId) || [];
    const userAnswers = eventAnswers.filter((a) => a.user_id === userId);
    const userUpvotes = eventUpvotes.filter((u) => u.user_id === userId);

    return {
      name: user?.name || "",
      email: user?.email || "",
      checked_in: reg.checked_in_at ? "Yes" : "No",
      checked_in_at: reg.checked_in_at || "",
      registered_at: reg.created_at,
      // Intake data
      goals: intake?.goals?.join("; ") || "",
      goals_other: intake?.goals_other || "",
      offers: intake?.offers?.join("; ") || "",
      offers_other: intake?.offers_other || "",
      intake_skipped: intake?.skipped ? "Yes" : "No",
      intake_completed_at: intake?.created_at || "",
      // Poll votes
      poll_votes_count: userPollVotes.length,
      poll_votes: userPollVotes.map((v) => {
        const poll = Array.isArray(v.poll) ? v.poll[0] : v.poll;
        const options = (poll as any)?.options || [];
        return `${(poll as any)?.question || ""}: ${options[v.option_index] || ""}`;
      }).join(" | "),
      // Q&A
      questions_asked: userQuestions.length,
      questions_content: userQuestions.map((q) => q.content).join(" | "),
      answers_provided: userAnswers.length,
      answers_content: userAnswers.map((a) => {
        const q = Array.isArray(a.question) ? a.question[0] : a.question;
        return `Q: ${(q as any)?.content || ""} | A: ${a.content}`;
      }).join(" | "),
      upvotes_count: userUpvotes.length,
    };
  });

  return { success: true, data: detailedData };
}
