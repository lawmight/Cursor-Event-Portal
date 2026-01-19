"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { createClient } from "@/lib/supabase/client";
import { QuestionCard } from "@/components/qa/QuestionCard";
import type { Event, Question } from "@/types";
import { ArrowLeft, MessageCircle, Filter, CheckCircle, EyeOff, Pin, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminQAClientProps {
  event: Event;
  initialQuestions: Question[];
  eventSlug: string;
  adminCode?: string;
  userId: string;
  sortBy: "new" | "trending";
  statusFilter: "all" | "open" | "answered" | "pinned" | "hidden";
}

export function AdminQAClient({
  event,
  initialQuestions,
  eventSlug,
  adminCode,
  userId,
  sortBy,
  statusFilter,
}: AdminQAClientProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [isPending, startTransition] = useTransition();

  // Separate questions by status
  const openQuestions = questions.filter((q) => q.status === "open");
  const answeredQuestions = questions.filter((q) => q.status === "answered");
  const pinnedQuestions = questions.filter((q) => q.status === "pinned");
  const hiddenQuestions = questions.filter((q) => q.status === "hidden");

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Subscribe to real-time question updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`admin-questions-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "questions",
          filter: `event_id=eq.${event.id}`,
        },
        async (payload) => {
          // Fetch the new question with relations
          const { data: newQuestion } = await supabase
            .from("questions")
            .select("*, user:users(*), answers(*, user:users(*))")
            .eq("id", payload.new.id)
            .single();

          if (newQuestion) {
            setQuestions((prev) => {
              if (prev.some((q) => q.id === newQuestion.id)) return prev;
              return [newQuestion, ...prev];
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
          filter: `event_id=eq.${event.id}`,
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
              const index = prev.findIndex((q) => q.id === updatedQuestion.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = updatedQuestion;
                return updated;
              }
              return prev;
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
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id]);

  return (
    <div className="min-h-screen bg-black-gradient text-white pb-20">
      <AdminHeader 
        eventSlug={eventSlug} 
        subtitle="Q&A Management" 
      />

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6">
          <div className="glass rounded-[32px] p-6 space-y-2">
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">Total</p>
            <p className="text-3xl font-light tracking-tight">{questions.length}</p>
          </div>
          <div className="glass rounded-[32px] p-6 space-y-2">
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">Open</p>
            <p className="text-3xl font-light tracking-tight text-white">{openQuestions.length}</p>
          </div>
          <div className="glass rounded-[32px] p-6 space-y-2">
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">Answered</p>
            <p className="text-3xl font-light tracking-tight text-white">{answeredQuestions.length}</p>
          </div>
          <div className="glass rounded-[32px] p-6 space-y-2">
            <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">Pinned</p>
            <p className="text-3xl font-light tracking-tight text-white">{pinnedQuestions.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Sort Toggle */}
          <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-full p-1 backdrop-blur-sm">
            <a
              href={`/admin/${eventSlug}/${adminCode}/qa?sort=trending&status=${statusFilter}`}
              className={cn(
                "relative px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold rounded-full transition-all duration-300 z-10",
                sortBy === "trending"
                  ? "bg-white text-black shadow-glow"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Hot
            </a>
            <a
              href={`/admin/${eventSlug}/${adminCode}/qa?sort=new&status=${statusFilter}`}
              className={cn(
                "relative px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold rounded-full transition-all duration-300 z-10",
                sortBy === "new"
                  ? "bg-white text-black shadow-glow"
                  : "text-gray-400 hover:text-white"
              )}
            >
              New
            </a>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-full p-1 backdrop-blur-md">
            <Filter className="w-3 h-3 text-gray-600 ml-2" />
            <a
              href={`/admin/${eventSlug}/${adminCode}/qa?sort=${sortBy}&status=all`}
              className={cn(
                "px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full transition-all",
                statusFilter === "all"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-600 hover:text-gray-400"
              )}
            >
              All
            </a>
            <a
              href={`/admin/${eventSlug}/${adminCode}/qa?sort=${sortBy}&status=open`}
              className={cn(
                "px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full transition-all",
                statusFilter === "open"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-600 hover:text-gray-400"
              )}
            >
              Open
            </a>
            <a
              href={`/admin/${eventSlug}/${adminCode}/qa?sort=${sortBy}&status=answered`}
              className={cn(
                "px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full transition-all",
                statusFilter === "answered"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-600 hover:text-gray-400"
              )}
            >
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Answered
            </a>
            <a
              href={`/admin/${eventSlug}/${adminCode}/qa?sort=${sortBy}&status=pinned`}
              className={cn(
                "px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full transition-all",
                statusFilter === "pinned"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-600 hover:text-gray-400"
              )}
            >
              <Pin className="w-3 h-3 inline mr-1" />
              Pinned
            </a>
            <a
              href={`/admin/${eventSlug}/${adminCode}/qa?sort=${sortBy}&status=hidden`}
              className={cn(
                "px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full transition-all",
                statusFilter === "hidden"
                  ? "bg-white text-black shadow-lg"
                  : "text-gray-600 hover:text-gray-400"
              )}
            >
              <EyeOff className="w-3 h-3 inline mr-1" />
              Hidden
            </a>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="ml-auto px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 text-gray-600 hover:text-white transition-all text-[9px] uppercase tracking-[0.2em] font-bold"
          >
            {isPending ? "..." : "Refresh"}
          </button>
        </div>

        {/* Questions List */}
        <div className="space-y-12">
          {questions.length === 0 ? (
            <div className="text-center py-24 glass rounded-[40px] border-dashed border-white/5 opacity-40">
              <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
                No questions found
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  eventSlug={eventSlug}
                  userRole="admin"
                  userId={userId}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-white/[0.03] flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Q&A</p>
        </div>
      </footer>
    </div>
  );
}

