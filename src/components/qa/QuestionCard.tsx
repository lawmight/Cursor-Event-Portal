"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { upvoteQuestion, createAnswer, updateQuestionStatus, acceptAnswer } from "@/lib/actions/questions";
import { timeAgo } from "@/lib/utils";
import type { Question, UserRole } from "@/types";
import { ChevronUp, MessageCircle, Check, Pin, EyeOff } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  eventSlug: string;
  userRole?: UserRole;
  userId?: string;
}

export function QuestionCard({ question, eventSlug, userRole, userId }: QuestionCardProps) {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [loading, setLoading] = useState(false);

  const isModerator = userRole && ["staff", "admin", "facilitator"].includes(userRole);

  const handleUpvote = async () => {
    setLoading(true);
    await upvoteQuestion(question.id, eventSlug);
    setLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) return;
    setLoading(true);
    await createAnswer(question.id, eventSlug, { content: answerContent.trim() });
    setAnswerContent("");
    setShowAnswerForm(false);
    setLoading(false);
  };

  const handleStatusChange = async (status: "answered" | "pinned" | "hidden") => {
    setLoading(true);
    await updateQuestionStatus(question.id, status, eventSlug);
    setLoading(false);
  };

  const handleAcceptAnswer = async (answerId: string) => {
    setLoading(true);
    await acceptAnswer(answerId, question.id, eventSlug);
    setLoading(false);
  };

  return (
    <div className={`glass rounded-[40px] p-8 transition-all duration-500 animate-slide-up relative overflow-hidden group ${
      question.status === "pinned" ? "border-white/20 bg-white/[0.04]" : "border-white/[0.03] bg-white/[0.01]"
    }`}>
      {question.status === "pinned" && (
        <div className="absolute top-0 right-0 p-4">
          <Pin className="w-3 h-3 text-white/40" />
        </div>
      )}

      <div className="flex gap-8">
        {/* Upvote Button - Ultra Sleek */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleUpvote}
            disabled={loading}
            className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center ${
              question.user_has_upvoted
                ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                : "bg-white/[0.02] border-white/10 text-gray-600 hover:text-white hover:border-white/30"
            }`}
          >
            <ChevronUp className={`w-5 h-5 stroke-[2.5px] transition-transform ${question.user_has_upvoted ? "scale-110" : "group-hover:-translate-y-0.5"}`} />
          </button>
          <span className={`text-sm font-light tabular-nums ${question.user_has_upvoted ? "text-white" : "text-gray-700"}`}>
            {question.upvotes}
          </span>
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <div key={tag} className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[8px] font-bold uppercase tracking-[0.2em] text-gray-600">
                  {tag}
                </div>
              ))}
            </div>
          )}

          {/* Question Text */}
          <p className="text-white text-xl font-light leading-relaxed tracking-tight">
            {question.content}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-gray-700 font-medium">
            <span className="text-gray-500">{question.user?.name || "Anonymous"}</span>
            <span className="opacity-20">/</span>
            <span>{timeAgo(question.created_at)}</span>
          </div>

          {/* Answers - Sleek Deep Depth */}
          {question.answers && question.answers.length > 0 && (
            <div className="mt-8 space-y-4">
              {question.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`p-6 rounded-[32px] relative ${
                    answer.is_accepted
                      ? "bg-white/[0.03] border border-white/10"
                      : "bg-black/20 border border-white/[0.02]"
                  }`}
                >
                  <p className="text-[15px] text-gray-400 font-light leading-relaxed mb-4">
                    {answer.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-gray-700 font-medium">
                      {answer.user?.name || "Expert"} · {timeAgo(answer.created_at)}
                    </span>
                    {isModerator && !answer.is_accepted && (
                      <button
                        onClick={() => handleAcceptAnswer(answer.id)}
                        disabled={loading}
                        className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold hover:text-white transition-colors"
                      >
                        Verify
                      </button>
                    )}
                    {answer.is_accepted && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Check className="w-3 h-3" />
                        <span className="text-[8px] uppercase tracking-[0.3em] font-bold">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions - Subtle */}
          <div className="mt-6 flex items-center gap-8 border-t border-white/[0.03] pt-6">
            <button
              onClick={() => setShowAnswerForm(!showAnswerForm)}
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gray-700 font-bold hover:text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 opacity-40" />
              Reply
            </button>

            {isModerator && (
              <div className="flex items-center gap-8">
                {question.status !== "pinned" && (
                  <button
                    onClick={() => handleStatusChange("pinned")}
                    disabled={loading}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gray-700 font-bold hover:text-white transition-colors"
                  >
                    <Pin className="w-3.5 h-3.5 opacity-40" />
                    Feature
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange("hidden")}
                  disabled={loading}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gray-700 font-bold hover:text-red-900 transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5 opacity-40" />
                  Discard
                </button>
              </div>
            )}
          </div>

          {/* Answer Form - Sleek Input */}
          {showAnswerForm && (
            <div className="mt-8 space-y-6 animate-slide-up">
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="Compose response..."
                className="w-full bg-transparent border-b border-white/10 rounded-none py-4 text-white placeholder:text-gray-800 focus:outline-none focus:border-white/30 transition-all min-h-[100px] text-lg font-light resize-none"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answerContent.trim()}
                  className="px-8 h-12 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 disabled:opacity-30 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                >
                  Publish
                </button>
                <button
                  onClick={() => setShowAnswerForm(false)}
                  className="px-8 h-12 rounded-full bg-white/[0.03] border border-white/5 text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
