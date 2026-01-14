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
    <Card className={`p-4 ${question.status === "pinned" ? "ring-2 ring-cursor-purple" : ""}`}>
      <div className="flex gap-3">
        {/* Upvote Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleUpvote}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              question.user_has_upvoted
                ? "bg-cursor-purple text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
            {question.upvotes}
          </span>
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {question.status === "pinned" && (
              <Badge variant="default">
                <Pin className="w-3 h-3 mr-1" />
                Pinned
              </Badge>
            )}
            {question.status === "answered" && (
              <Badge variant="success">
                <Check className="w-3 h-3 mr-1" />
                Answered
              </Badge>
            )}
            {question.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Question Text */}
          <p className="text-gray-900 dark:text-white mb-2">
            {question.content}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{question.user?.name || "Anonymous"}</span>
            <span>·</span>
            <span>{timeAgo(question.created_at)}</span>
          </div>

          {/* Answers */}
          {question.answers && question.answers.length > 0 && (
            <div className="mt-4 space-y-3">
              {question.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`p-3 rounded-lg ${
                    answer.is_accepted
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                    {answer.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {answer.user?.name || "Anonymous"} · {timeAgo(answer.created_at)}
                    </span>
                    {isModerator && !answer.is_accepted && (
                      <button
                        onClick={() => handleAcceptAnswer(answer.id)}
                        disabled={loading}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        Accept
                      </button>
                    )}
                    {answer.is_accepted && (
                      <Badge variant="success" className="text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Accepted
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnswerForm(!showAnswerForm)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Answer
            </Button>

            {isModerator && (
              <>
                {question.status !== "pinned" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange("pinned")}
                    disabled={loading}
                  >
                    <Pin className="w-4 h-4 mr-1" />
                    Pin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStatusChange("hidden")}
                  disabled={loading}
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Hide
                </Button>
              </>
            )}
          </div>

          {/* Answer Form */}
          {showAnswerForm && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="Write your answer..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answerContent.trim()}
                >
                  Submit Answer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnswerForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
