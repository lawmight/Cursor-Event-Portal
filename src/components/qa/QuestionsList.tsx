"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QuestionCard } from "./QuestionCard";
import type { Question, UserRole } from "@/types";

interface QuestionsListProps {
  initialQuestions: Question[];
  eventSlug: string;
  eventId: string;
  userRole?: UserRole;
  userId: string;
  sortBy: "trending" | "new";
}

export function QuestionsList({
  initialQuestions,
  eventSlug,
  eventId,
  userRole,
  userId,
  sortBy,
}: QuestionsListProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  // Subscribe to real-time question updates
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new questions
    const channel = supabase
      .channel(`questions-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "questions",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Fetch the new question with relations
          const { data: newQuestion } = await supabase
            .from("questions")
            .select("*, user:users(*), answers(*, user:users(*))")
            .eq("id", payload.new.id)
            .single();

          if (newQuestion && newQuestion.status !== "hidden") {
            setQuestions((prev) => {
              // Check if question already exists (avoid duplicates)
              if (prev.some((q) => q.id === newQuestion.id)) {
                return prev;
              }
              // Add new question at the beginning for "new" sort, or by hot score for "trending"
              if (sortBy === "new") {
                return [newQuestion, ...prev];
              } else {
                // Calculate hot score for sorting
                const calculateHotScore = (q: Question) => {
                  const upvotes = q.upvotes || 0;
                  const answersCount = q.answers?.length || 0;
                  const createdAt = new Date(q.created_at);
                  const now = new Date();
                  const hoursSinceCreation = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
                  const engagement = upvotes * 2 + answersCount * 1.5;
                  const timeDecay = Math.pow(hoursSinceCreation + 2, 1.5);
                  return engagement / timeDecay;
                };
                // Insert in sorted order by hot score
                const sorted = [...prev, newQuestion].sort(
                  (a, b) => calculateHotScore(b) - calculateHotScore(a)
                );
                return sorted;
              }
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "questions",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Fetch updated question with relations
          const { data: updatedQuestion } = await supabase
            .from("questions")
            .select("*, user:users(*), answers(*, user:users(*))")
            .eq("id", payload.new.id)
            .single();

          if (updatedQuestion) {
            setQuestions((prev) => {
              // Remove if hidden, otherwise update
              if (updatedQuestion.status === "hidden") {
                return prev.filter((q) => q.id !== updatedQuestion.id);
              }
              // Update existing question
              const index = prev.findIndex((q) => q.id === updatedQuestion.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = updatedQuestion;
                // Re-sort if needed
                if (sortBy === "trending") {
                  const calculateHotScore = (q: Question) => {
                    const upvotes = q.upvotes || 0;
                    const answersCount = q.answers?.length || 0;
                    const createdAt = new Date(q.created_at);
                    const now = new Date();
                    const hoursSinceCreation = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
                    const engagement = upvotes * 2 + answersCount * 1.5;
                    const timeDecay = Math.pow(hoursSinceCreation + 2, 1.5);
                    return engagement / timeDecay;
                  };
                  return updated.sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
                }
                return updated;
              } else {
                // Add if it's new and not hidden
                if (sortBy === "new") {
                  return [updatedQuestion, ...prev];
                } else {
                  const calculateHotScore = (q: Question) => {
                    const upvotes = q.upvotes || 0;
                    const answersCount = q.answers?.length || 0;
                    const createdAt = new Date(q.created_at);
                    const now = new Date();
                    const hoursSinceCreation = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
                    const engagement = upvotes * 2 + answersCount * 1.5;
                    const timeDecay = Math.pow(hoursSinceCreation + 2, 1.5);
                    return engagement / timeDecay;
                  };
                  const sorted = [...prev, updatedQuestion].sort(
                    (a, b) => calculateHotScore(b) - calculateHotScore(a)
                  );
                  return sorted;
                }
              }
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "questions",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
        }
      )
      .subscribe();

    // Also refresh when sort changes
    const refreshChannel = supabase
      .channel(`questions-refresh-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "question_upvotes",
        },
        () => {
          // Refresh questions when upvotes change
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(refreshChannel);
    };
  }, [eventId, router, sortBy]);

  // Update questions when sortBy changes
  useEffect(() => {
    router.refresh();
  }, [sortBy, router]);

  // Separate pinned questions
  const pinnedQuestions = questions.filter((q) => q.status === "pinned");
  const otherQuestions = questions.filter((q) => q.status !== "pinned");

  return (
    <div className="space-y-12">
      {/* Pinned Questions */}
      {pinnedQuestions.length > 0 && (
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-4 px-2">
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">
              Featured
            </p>
            <div className="h-px flex-1 bg-white/3" />
          </div>
          <div className="space-y-6">
            {pinnedQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                eventSlug={eventSlug}
                userRole={userRole}
                userId={userId}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Questions */}
      <div className="space-y-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
        {pinnedQuestions.length > 0 && (
          <div className="flex items-center gap-4 px-2">
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">
              Recent
            </p>
            <div className="h-px flex-1 bg-white/3" />
          </div>
        )}

        {otherQuestions.length === 0 ? (
          <div className="text-center py-24 bg-white/1 border border-white/5 rounded-[40px] border-dashed opacity-40">
            <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em] font-medium">
              Awaiting first inquiry
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {otherQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                eventSlug={eventSlug}
                userRole={userRole}
                userId={userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

