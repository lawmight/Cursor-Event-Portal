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

function getVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be") {
      const v = u.pathname.slice(1).split("/")[0];
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
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
  const [judgeScore, setJudgeScore] = useState(3);
  const isOwn = entry.user_id === userId;
  const ghRepo = parseGitHubRepo(entry.repo_url);
  const stackBlitzUrl = ghRepo ? `https://stackblitz.com/github/${ghRepo.owner}/${ghRepo.repo}` : null;
  const videoEmbedUrl = entry.video_url ? getVideoEmbedUrl(entry.video_url) : null;

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
      {/* Preview media: image and/or video — for voting and big-screen showcase */}
      {(entry.preview_image_url || videoEmbedUrl) && (
        <div className="aspect-video w-full bg-white/5 relative overflow-hidden">
          {entry.preview_image_url && (
            <img
              src={entry.preview_image_url}
              alt={`Preview: ${entry.title}`}
              className="w-full h-full object-contain object-center"
            />
          )}
          {videoEmbedUrl && !entry.preview_image_url && (
            <iframe
              src={videoEmbedUrl}
              title={`Video: ${entry.title}`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      )}
      {entry.video_url && entry.preview_image_url && (
        <div className="px-4 pt-2 pb-0">
          <a
            href={entry.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-300 hover:underline"
          >
            Watch video
          </a>
        </div>
      )}
      {entry.video_url && !videoEmbedUrl && !entry.preview_image_url && (
        <div className="p-4">
          <a
            href={entry.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-300 hover:underline"
          >
            Open video →
          </a>
        </div>
      )}

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
          {stackBlitzUrl && (
            <a
              href={stackBlitzUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              Open in StackBlitz
            </a>
          )}

          <a
            href={entry.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 transition-all"
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
    </div>
  );
}
