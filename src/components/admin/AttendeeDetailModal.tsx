"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Calendar, CheckCircle, MessageCircle, BarChart3, ThumbsUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AttendeeDetailModalProps {
  userId: string;
  eventId: string;
  userName: string;
  userEmail: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AttendeeDetails {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: string;
    created_at: string;
  };
  intake: {
    goals: string[];
    offers: string[];
    goals_other?: string | null;
    offers_other?: string | null;
    skipped: boolean;
    created_at: string;
  } | null;
  pollVotes: Array<{
    id: string;
    option_index: number;
    created_at: string;
    poll: {
      id: string;
      question: string;
      options: string[];
      created_at: string;
    };
  }>;
  questions: Array<{
    id: string;
    content: string;
    upvotes: number;
    status: string;
    tags: string[];
    created_at: string;
    answers: Array<{
      id: string;
      content: string;
      is_accepted: boolean;
      created_at: string;
      user: {
        id: string;
        name: string;
      };
    }>;
  }>;
  answers: Array<{
    id: string;
    content: string;
    is_accepted: boolean;
    created_at: string;
    question: {
      id: string;
      content: string;
      created_at: string;
    };
  }>;
  upvotes: Array<{
    question: {
      id: string;
      content: string;
    };
    created_at: string;
  }>;
}

const GOAL_LABELS: Record<string, string> = {
  "learn-ai": "Learn AI/ML",
  "learn-coding": "Coding",
  "networking": "Networking",
  "find-cofounders": "Co-founders",
  "hire-talent": "Hire",
  "find-job": "Job Search",
  "explore-tools": "Tools",
  "other": "Other",
};

const OFFER_LABELS: Record<string, string> = {
  "ai-expertise": "AI/ML",
  "software-dev": "Dev",
  "design": "Design",
  "business-strategy": "Strategy",
  "funding-investment": "Funding",
  "mentorship": "Mentor",
  "collaboration": "Collab",
  "other": "Other",
};

export function AttendeeDetailModal({
  userId,
  eventId,
  userName,
  userEmail,
  isOpen,
  onClose,
}: AttendeeDetailModalProps) {
  const [details, setDetails] = useState<AttendeeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId && eventId) {
      fetchDetails();
    }
  }, [isOpen, userId, eventId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/attendee-details?userId=${userId}&eventId=${eventId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch attendee details");
      }
      const data = await response.json();
      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] glass rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-white/80" />
            </div>
            <div>
              <h2 className="text-2xl font-light text-white tracking-tight">
                {userName}
              </h2>
              {userEmail && (
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : details ? (
            <>
              {/* Intake Data */}
              {details.intake && !details.intake.skipped ? (
                <div className="glass rounded-[32px] p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-light text-white tracking-tight">
                      Skills & Goals
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {details.intake.goals && details.intake.goals.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-2">
                          Looking For
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {details.intake.goals
                            .filter((g) => g !== "other")
                            .map((goal) => (
                              <Badge
                                key={goal}
                                variant="outline"
                                className="bg-white/5 border-white/10 text-white text-[9px] uppercase tracking-widest py-1 px-3 rounded-full"
                              >
                                {GOAL_LABELS[goal] || goal}
                              </Badge>
                            ))}
                          {details.intake.goals_other && (
                            <Badge
                              variant="outline"
                              className="bg-white/5 border-white/10 text-white text-[9px] uppercase tracking-widest py-1 px-3 rounded-full italic"
                            >
                              {details.intake.goals_other}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {details.intake.offers && details.intake.offers.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-2">
                          Can Offer
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {details.intake.offers
                            .filter((o) => o !== "other")
                            .map((offer) => (
                              <Badge
                                key={offer}
                                variant="outline"
                                className="bg-white/20 border-white/30 text-white text-[9px] uppercase tracking-widest py-1 px-3 rounded-full font-bold"
                              >
                                {OFFER_LABELS[offer] || offer}
                              </Badge>
                            ))}
                          {details.intake.offers_other && (
                            <Badge
                              variant="outline"
                              className="bg-white/20 border-white/30 text-white text-[9px] uppercase tracking-widest py-1 px-3 rounded-full font-bold italic"
                            >
                              {details.intake.offers_other}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass rounded-[32px] p-6 border border-white/10 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                    No intake data provided
                  </p>
                </div>
              )}

              {/* Poll Votes */}
              {details.pollVotes.length > 0 && (
                <div className="glass rounded-[32px] p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-light text-white tracking-tight">
                      Poll Votes ({details.pollVotes.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {details.pollVotes.map((vote) => (
                      <div
                        key={vote.id}
                        className="p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <p className="text-sm text-white/90 mb-2">
                          {vote.poll.question}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                            Voted:
                          </span>
                          <Badge className="bg-white/20 text-white text-[9px]">
                            {vote.poll.options[vote.option_index]}
                          </Badge>
                          <span className="text-[9px] text-gray-600 ml-auto">
                            {new Date(vote.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions Asked */}
              {details.questions.length > 0 && (
                <div className="glass rounded-[32px] p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-light text-white tracking-tight">
                      Questions Asked ({details.questions.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {details.questions.map((question) => (
                      <div
                        key={question.id}
                        className="p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <p className="text-sm text-white/90 mb-2">
                          {question.content}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="w-3 h-3 text-gray-600" />
                            <span className="text-[9px] text-gray-600">
                              {question.upvotes} upvotes
                            </span>
                          </div>
                          {question.answers.length > 0 && (
                            <span className="text-[9px] text-gray-600">
                              {question.answers.length} answer
                              {question.answers.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          <span className="text-[9px] text-gray-600 ml-auto">
                            {new Date(question.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answers Provided */}
              {details.answers.length > 0 && (
                <div className="glass rounded-[32px] p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-light text-white tracking-tight">
                      Answers Provided ({details.answers.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {details.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className="p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-2">
                          Question:
                        </p>
                        <p className="text-sm text-white/70 mb-3">
                          {answer.question.content}
                        </p>
                        <p className="text-sm text-white/90 mb-2">
                          {answer.content}
                        </p>
                        <div className="flex items-center gap-2">
                          {answer.is_accepted && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">
                              Accepted
                            </Badge>
                          )}
                          <span className="text-[9px] text-gray-600 ml-auto">
                            {new Date(answer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upvoted Questions */}
              {details.upvotes.length > 0 && (
                <div className="glass rounded-[32px] p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-light text-white tracking-tight">
                      Upvoted Questions ({details.upvotes.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {details.upvotes.map((upvote, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/5 rounded-xl border border-white/10"
                      >
                        <p className="text-sm text-white/80">
                          {upvote.question.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!details.intake?.skipped &&
                details.pollVotes.length === 0 &&
                details.questions.length === 0 &&
                details.answers.length === 0 &&
                details.upvotes.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                      No additional activity data
                    </p>
                  </div>
                )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
