"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "./registration";
import { revalidatePath } from "next/cache";
import type { QuestionFormData, AnswerFormData, QuestionStatus } from "@/types";

function getAdminQAPath(eventSlug: string, adminCode?: string) {
  return adminCode ? `/admin/${eventSlug}/${adminCode}/qa` : `/admin/${eventSlug}/qa`;
}

async function validateAdminAccess(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  eventId: string,
  adminCode?: string
) {
  if (adminCode) {
    const { data: event } = await supabase
      .from("events")
      .select("admin_code")
      .eq("id", eventId)
      .single();

    if (event && event.admin_code === adminCode) {
      // Prefer a real session userId when available; otherwise fall back to any admin user.
      const session = await getSession();
      let userId = session?.userId;

      if (!userId) {
        const { data: adminUser } = await supabase
          .from("users")
          .select("id")
          .eq("role", "admin")
          .limit(1)
          .maybeSingle();
        userId = adminUser?.id;
      }

      return { valid: true as const, userId };
    }

    return { valid: false as const, error: "Not authorized" };
  }

  const session = await getSession();
  if (!session) {
    return { valid: false as const, error: "Not authenticated" };
  }

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || !["staff", "admin", "facilitator"].includes(user.role)) {
    return { valid: false as const, error: "Not authorized" };
  }

  return { valid: true as const, userId: session.userId };
}

export async function createQuestion(
  eventId: string,
  eventSlug: string,
  formData: QuestionFormData
) {
  console.log("[createQuestion] Starting question creation for event:", eventId);
  const session = await getSession();
  if (!session) {
    console.log("[createQuestion] Not authenticated");
    return { error: "Not authenticated" };
  }

  try {
    const supabase = await createServiceClient();

    console.log("[createQuestion] Inserting question:", {
      event_id: eventId,
      user_id: session.userId,
      content_length: formData.content?.length || 0,
      tags: formData.tags,
    });

    const { data, error } = await supabase.from("questions").insert({
      event_id: eventId,
      user_id: session.userId,
      content: formData.content,
      tags: formData.tags,
      status: "open",
      upvotes: 0,
    }).select();

    if (error) {
      console.error("[createQuestion] Failed to create question:", error);
      // Check if it's an API key error
      if (error.message?.includes("Invalid API key") || error.message?.includes("JWT")) {
        return { error: "Server configuration error. Please contact support." };
      }
      return { error: `Failed to create question: ${error.message}` };
    }

    console.log("[createQuestion] Question created successfully:", data?.[0]?.id);

    revalidatePath(`/${eventSlug}/qa`);
    revalidatePath(`/${eventSlug}/socials/qa`);
    revalidatePath(getAdminQAPath(eventSlug));
    return { success: true };
  } catch (error) {
    console.error("[createQuestion] Exception creating question:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Check if it's an environment variable error
    if (errorMessage.includes("Missing") || errorMessage.includes("environment")) {
      return { error: "Server configuration error. Please contact support." };
    }
    return { error: `Failed to create question: ${errorMessage}` };
  }
}

export async function upvoteQuestion(questionId: string, eventSlug: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  // Check if already upvoted
  const { data: existing } = await supabase
    .from("question_upvotes")
    .select("question_id")
    .eq("question_id", questionId)
    .eq("user_id", session.userId)
    .single();

  if (existing) {
    // Remove upvote
    await supabase
      .from("question_upvotes")
      .delete()
      .eq("question_id", questionId)
      .eq("user_id", session.userId);

    // Decrement count
    await supabase.rpc("decrement_upvotes", { question_id: questionId });
  } else {
    // Add upvote
    await supabase.from("question_upvotes").insert({
      question_id: questionId,
      user_id: session.userId,
    });

    // Increment count
    await supabase.rpc("increment_upvotes", { question_id: questionId });
  }

  revalidatePath(`/${eventSlug}/qa`);
  revalidatePath(`/${eventSlug}/socials/qa`);
  revalidatePath(getAdminQAPath(eventSlug));
  return { success: true };
}

export async function createAnswer(
  questionId: string,
  eventSlug: string,
  formData: AnswerFormData,
  adminCode?: string
) {
  console.log("[createAnswer] Called with:", {
    questionId,
    eventSlug,
    contentLength: formData.content?.length,
    hasAdminCode: !!adminCode,
  });

  const supabase = await createServiceClient();

  const { data: question } = await supabase
    .from("questions")
    .select("event_id")
    .eq("id", questionId)
    .single();

  if (!question) {
    return { error: "Question not found" };
  }

  const auth = await validateAdminAccess(supabase, question.event_id, adminCode);
  if (!auth.valid) {
    return { error: auth.error || "Not authorized" };
  }

  if (!auth.userId) {
    return { error: "No admin user available to post replies" };
  }

  const { data, error } = await supabase.from("answers").insert({
    question_id: questionId,
    user_id: auth.userId,
    content: formData.content,
  }).select();

  if (error) {
    console.error("[createAnswer] Failed to create answer:", error);
    return { error: "Failed to create answer" };
  }

  console.log("[createAnswer] Successfully created answer:", data?.[0]?.id);
  revalidatePath(`/${eventSlug}/qa`);
  revalidatePath(`/${eventSlug}/socials/qa`);
  revalidatePath(getAdminQAPath(eventSlug, adminCode));
  return { success: true };
}

export async function updateQuestionStatus(
  questionId: string,
  status: QuestionStatus,
  eventSlug: string,
  adminCode?: string
) {
  console.log("[updateQuestionStatus] Called with:", {
    questionId,
    status,
    eventSlug,
    hasAdminCode: !!adminCode,
  });

  const supabase = await createServiceClient();

  const { data: question } = await supabase
    .from("questions")
    .select("event_id")
    .eq("id", questionId)
    .single();

  if (!question) {
    return { error: "Question not found" };
  }

  const auth = await validateAdminAccess(supabase, question.event_id, adminCode);
  if (!auth.valid) {
    console.log("[updateQuestionStatus] Not authorized");
    return { error: auth.error || "Not authorized" };
  }

  const { error } = await supabase
    .from("questions")
    .update({ status })
    .eq("id", questionId);

  if (error) {
    console.error("[updateQuestionStatus] Failed to update:", error);
    return { error: "Failed to update question" };
  }

  console.log("[updateQuestionStatus] Successfully updated question status to:", status);
  revalidatePath(`/${eventSlug}/qa`);
  revalidatePath(`/${eventSlug}/socials/qa`);
  revalidatePath(getAdminQAPath(eventSlug, adminCode));
  return { success: true };
}

export async function deleteQuestion(
  questionId: string,
  eventSlug: string,
  adminCode?: string
) {
  console.log("[deleteQuestion] Called with:", {
    questionId,
    eventSlug,
    hasAdminCode: !!adminCode,
  });

  const supabase = await createServiceClient();

  const { data: question } = await supabase
    .from("questions")
    .select("event_id")
    .eq("id", questionId)
    .single();

  if (!question) {
    return { error: "Question not found" };
  }

  const auth = await validateAdminAccess(supabase, question.event_id, adminCode);
  if (!auth.valid) {
    console.log("[deleteQuestion] Not authorized");
    return { error: auth.error || "Not authorized" };
  }

  // Delete the question (CASCADE will handle related answers and upvotes)
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    console.error("[deleteQuestion] Failed to delete:", error);
    return { error: "Failed to delete question" };
  }

  console.log("[deleteQuestion] Successfully deleted question:", questionId);
  revalidatePath(`/${eventSlug}/qa`);
  revalidatePath(`/${eventSlug}/socials/qa`);
  revalidatePath(getAdminQAPath(eventSlug, adminCode));
  return { success: true };
}

export async function acceptAnswer(
  answerId: string,
  questionId: string,
  eventSlug: string,
  adminCode?: string
) {
  const supabase = await createServiceClient();

  const { data: question } = await supabase
    .from("questions")
    .select("event_id")
    .eq("id", questionId)
    .single();

  if (!question) {
    return { error: "Question not found" };
  }

  const auth = await validateAdminAccess(supabase, question.event_id, adminCode);
  if (!auth.valid) {
    return { error: auth.error || "Not authorized" };
  }

  // Reset all answers for this question
  await supabase
    .from("answers")
    .update({ is_accepted: false })
    .eq("question_id", questionId);

  // Accept this answer
  const { error } = await supabase
    .from("answers")
    .update({ is_accepted: true })
    .eq("id", answerId);

  if (error) {
    return { error: "Failed to accept answer" };
  }

  // Mark question as answered
  await supabase
    .from("questions")
    .update({ status: "answered" })
    .eq("id", questionId);

  revalidatePath(`/${eventSlug}/qa`);
  revalidatePath(`/${eventSlug}/socials/qa`);
  revalidatePath(getAdminQAPath(eventSlug, adminCode));
  return { success: true };
}
