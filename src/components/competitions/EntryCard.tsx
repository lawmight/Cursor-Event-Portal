"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ThumbsUp, ExternalLink, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { castVote } from "@/lib/actions/competitions";
import type { CompetitionEntry, VotingMode } from "@/types";

interface EntryCardProps {
  entry: CompetitionEntry;
  competitionId: string;
  eventSlug: string;
  userId: string;
  canVote: boolean;
  votingMode: VotingMode;
  isWinner: boolean;
}

function parseGitHubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

export function EntryCard({
  entry,
  competitionId,
  eventSlug,
  userId,
  canVote,
  votingMode,
  isWinner,
}: EntryCardProps) {
  const router = useRouter();
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  const [judgeScore, setJudgeScore] = useState(3);
  const isOwn = entry.user_id === userId;
  const ghRepo = parseGitHubRepo(entry.repo_url);

  const handleVote = async (score: number = 1, isJudge: boolean = false) => {
    setVoteError(null);
    setVoting(true);
    const result = await castVote(competitionId, entry.id, eventSlug, score, isJudge);
    setVoting(false);
    if (result?.error) {
      setVoteError(result.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        isWinner
          ? "border-yellow-500/30 bg-yellow-500/5"
          : "border-white/10 bg-white/5"
      )}
    >
      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isWinner && <Trophy className="w-4 h-4 text-yellow-400" />}
            <h3 className="text-base font-medium text-white">{entry.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {entry.vote_count !== undefined && (
              <span className="text-xs text-gray-500">
                {entry.vote_count} vote{entry.vote_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* User */}
        {entry.user && (
          <p className="text-xs text-gray-500">
            by {entry.user.name}
          </p>
        )}

        {/* Description */}
        {entry.description && (
          <p className="text-sm text-gray-400 leading-relaxed">
            {entry.description}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-1 flex-wrap">
          {ghRepo ? (
            <button
              onClick={() => setShowEmbed(!showEmbed)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                showEmbed
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-white/10 text-gray-300 border border-white/10 hover:bg-white/15"
              )}
            >
              <Code className="w-3.5 h-3.5" />
              {showEmbed ? "Hide Preview" : "View Project"}
            </button>
          ) : (
            <a
              href={entry.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 text-gray-300 border border-white/10 hover:bg-white/15 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Link
            </a>
          )}

          <a
            href={entry.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            GitHub
          </a>

          {entry.project_url && (
            <a
              href={entry.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 text-gray-300 border border-white/10 hover:bg-white/15 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live Demo
            </a>
          )}

          {voteError && (
            <p className="text-xs text-red-400">{voteError}</p>
          )}

          {/* Vote button */}
          {canVote && !isOwn && (
            <>
              {votingMode === "judges" || votingMode === "both" ? (
                <div className="flex items-center gap-2 ml-auto">
                  <select
                    value={judgeScore}
                    onChange={(e) => setJudgeScore(Number(e.target.value))}
                    className="bg-white/10 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleVote(judgeScore, true)}
                    disabled={voting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Score
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleVote(1, false)}
                  disabled={voting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50 ml-auto"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Vote
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* StackBlitz embed */}
      {showEmbed && ghRepo && (
        <div className="border-t border-white/10">
          <iframe
            src={`https://stackblitz.com/github/${ghRepo.owner}/${ghRepo.repo}?embed=1&view=preview`}
            className="w-full h-[500px]"
            title={`${entry.title} preview`}
            allow="cross-origin-isolated"
          />
        </div>
      )}
    </div>
  );
}
