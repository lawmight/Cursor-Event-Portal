"use client";

import { useState } from "react";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntryCard } from "./EntryCard";
import { SubmitEntryModal } from "./SubmitEntryModal";
import type { CompetitionWithEntries } from "@/types";

interface CompetitionCardProps {
  competition: CompetitionWithEntries;
  eventSlug: string;
  userId: string;
}

const statusLabels: Record<string, string> = {
  active: "Accepting Submissions",
  voting: "Voting Open",
  ended: "Ended",
};

const statusColors: Record<string, string> = {
  active: "text-green-400",
  voting: "text-blue-400",
  ended: "text-gray-500",
};

export function CompetitionCard({ competition, eventSlug, userId }: CompetitionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const userHasEntry = competition.entries?.some((e) => e.user_id === userId);
  const canSubmit = competition.status === "active" && !userHasEntry;
  const canVote = competition.status === "voting";

  return (
    <div className="glass rounded-[32px] border border-white/10 min-w-0 overflow-visible">
      {/* Winner banner */}
      {competition.winner_entry && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-b border-yellow-500/20 px-8 py-4 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-yellow-300 font-medium">
            Winner: {competition.winner_entry.title}
            {competition.winner_entry.user && (
              <span className="text-yellow-400/60 ml-1">
                by {competition.winner_entry.user.name}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-8 py-6 flex items-center justify-between text-left"
      >
        <div className="space-y-1">
          <h2 className="text-xl font-light text-white tracking-tight">
            {competition.title}
          </h2>
          <div className="flex items-center gap-4">
            <span className={cn("text-[10px] uppercase tracking-[0.2em] font-medium", statusColors[competition.status])}>
              {statusLabels[competition.status]}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
              {competition.entries?.length || 0} entries
            </span>
            {competition.voting_mode !== "group" && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
                {competition.voting_mode} voting
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-8 pb-8 space-y-6">
          {competition.description && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {competition.description}
            </p>
          )}

          {competition.rules && (
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
                Rules
              </p>
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                {competition.rules}
              </p>
            </div>
          )}

          {/* Submit button - only when status is "active" */}
          {canSubmit && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 rounded-2xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all"
            >
              Submit Your Project
            </button>
          )}

          {/* Voting open but no entries yet */}
          {canVote && (!competition.entries || competition.entries.length === 0) && (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-6 text-center">
              <p className="text-sm text-gray-400">
                Voting is open, but there are no submissions yet. Vote buttons will appear here when projects are submitted.
              </p>
            </div>
          )}

          {/* Ended with no entries */}
          {competition.status === "ended" && (!competition.entries || competition.entries.length === 0) && (
            <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-6 text-center">
              <p className="text-sm text-gray-400">
                This competition ended with no submissions.
              </p>
            </div>
          )}

          {/* Entries list - with vote buttons when voting is open */}
          {competition.entries && competition.entries.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
                Submissions
              </p>
              {competition.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  competitionId={competition.id}
                  eventSlug={eventSlug}
                  userId={userId}
                  canVote={canVote}
                  votingMode={competition.voting_mode}
                  isWinner={entry.id === competition.winner_entry_id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showSubmitModal && (
        <SubmitEntryModal
          competitionId={competition.id}
          eventSlug={eventSlug}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
}
