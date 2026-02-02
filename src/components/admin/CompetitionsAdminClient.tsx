"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Trophy,
  Play,
  Vote,
  Square,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createCompetition,
  updateCompetition,
  deleteCompetition,
  updateCompetitionStatus,
  selectWinner,
} from "@/lib/actions/competitions";
import type { CompetitionWithEntries, CompetitionStatus } from "@/types";

interface CompetitionsAdminClientProps {
  eventId: string;
  eventSlug: string;
  adminCode: string;
  initialCompetitions: CompetitionWithEntries[];
}

const statusActions: Record<string, { label: string; next: CompetitionStatus; icon: typeof Play }> = {
  draft: { label: "Activate", next: "active", icon: Play },
  active: { label: "Open Voting", next: "voting", icon: Vote },
  voting: { label: "End Competition", next: "ended", icon: Square },
};

const statusBadge: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400",
  active: "bg-green-500/20 text-green-400",
  voting: "bg-blue-500/20 text-blue-400",
  ended: "bg-gray-500/20 text-gray-500",
};

export function CompetitionsAdminClient({
  eventId,
  eventSlug,
  adminCode,
  initialCompetitions,
}: CompetitionsAdminClientProps) {
  const [competitions, setCompetitions] = useState(initialCompetitions);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRules, setNewRules] = useState("");
  const [newVotingMode, setNewVotingMode] = useState("group");
  const [newMaxEntries, setNewMaxEntries] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError("Title is required.");
      return;
    }

    setLoading("create");
    setError(null);
    try {
      const result = await createCompetition(
        eventId,
        eventSlug,
        {
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          rules: newRules.trim() || undefined,
          voting_mode: newVotingMode,
          max_entries: newMaxEntries ? (parseInt(newMaxEntries, 10) || undefined) : undefined,
        },
        adminCode
      );

      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result && "success" in result && result.success) {
        setNewTitle("");
        setNewDesc("");
        setNewRules("");
        setNewVotingMode("group");
        setNewMaxEntries("");
        setShowCreateForm(false);
        window.location.reload();
        return;
      }
      setError("Create failed. No response from server.");
    } catch (err) {
      console.error("[CompetitionsAdminClient] createCompetition failed:", err);
      const message = err instanceof Error ? err.message : "Create failed.";
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  const handleStatusChange = async (compId: string, nextStatus: string) => {
    setLoading(compId);
    const result = await updateCompetitionStatus(compId, eventSlug, nextStatus, adminCode);
    if (result.error) {
      setError(result.error);
    } else {
      window.location.reload();
    }
    setLoading(null);
  };

  const handleDelete = async (compId: string) => {
    if (!confirm("Delete this competition and all its entries?")) return;
    setLoading(compId);
    await deleteCompetition(compId, eventSlug, adminCode);
    window.location.reload();
    setLoading(null);
  };

  const handleSelectWinner = async (compId: string, method: "auto" | "manual", entryId?: string) => {
    setLoading(compId);
    const result = await selectWinner(compId, eventSlug, method, entryId, adminCode);
    if (result.error) {
      setError(result.error);
    } else {
      window.location.reload();
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Create button */}
      {!showCreateForm && (
        <button
          type="button"
          onClick={() => { setShowCreateForm(true); setError(null); }}
          className="glass rounded-[32px] p-6 border-white/10 hover:bg-white/10 transition-all w-full flex items-center gap-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-all">
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </div>
          <span className="text-sm text-gray-400 group-hover:text-white">Create Competition</span>
        </button>
      )}

      {/* Create form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="glass rounded-[32px] p-8 border-white/10 space-y-5">
          <h3 className="text-lg font-light text-white">New Competition</h3>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20"
              placeholder="Competition title"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Description</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20 resize-none"
              placeholder="What is this competition about?"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Rules</label>
            <textarea
              value={newRules}
              onChange={(e) => setNewRules(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20 resize-none"
              placeholder="Competition rules..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Voting Mode</label>
              <select
                value={newVotingMode}
                onChange={(e) => setNewVotingMode(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20 [&_option]:bg-white [&_option]:text-gray-900"
              >
                <option value="group" style={{ backgroundColor: "#fff", color: "#111" }}>Group (Upvote)</option>
                <option value="judges" style={{ backgroundColor: "#fff", color: "#111" }}>Judges (1-5)</option>
                <option value="both" style={{ backgroundColor: "#fff", color: "#111" }}>Both</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Max Entries</label>
              <input
                type="number"
                value={newMaxEntries}
                onChange={(e) => setNewMaxEntries(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20"
                placeholder="Unlimited"
                min={1}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading === "create"}
              className="px-6 py-3 rounded-2xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50"
            >
              {loading === "create" ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-3 rounded-2xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Competitions list */}
      {competitions.map((comp) => {
        const isExpanded = expandedId === comp.id;
        const action = statusActions[comp.status];

        return (
          <div key={comp.id} className="glass rounded-[32px] border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
              <button
                onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                className="flex items-center gap-4 text-left flex-1"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-light text-white">{comp.title}</h3>
                    <span className={cn("text-[10px] uppercase tracking-[0.15em] font-medium px-2 py-0.5 rounded-full", statusBadge[comp.status])}>
                      {comp.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {comp.entries?.length || 0} entries - {comp.voting_mode} voting
                    {comp.winner_entry_id && " - Winner selected"}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              <div className="flex items-center gap-2 ml-4">
                {action && (
                  <button
                    onClick={() => handleStatusChange(comp.id, action.next)}
                    disabled={loading === comp.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/15 transition-all disabled:opacity-50"
                  >
                    <action.icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(comp.id)}
                  disabled={loading === comp.id}
                  className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded: entries */}
            {isExpanded && (
              <div className="border-t border-white/10 p-6 space-y-4">
                {comp.description && (
                  <p className="text-sm text-gray-400">{comp.description}</p>
                )}

                {/* Winner selection (when ended or voting) */}
                {(comp.status === "voting" || comp.status === "ended") && (
                  <div className="bg-white/5 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
                      Winner Selection
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectWinner(comp.id, "auto")}
                        disabled={loading === comp.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-300 text-xs font-medium hover:bg-yellow-500/30 transition-all disabled:opacity-50"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        Auto (Highest Score)
                      </button>
                    </div>
                    {comp.winner_entry_id && (
                      <p className="text-xs text-yellow-400">
                        Current winner: {comp.entries?.find((e) => e.id === comp.winner_entry_id)?.title || "Unknown"}
                      </p>
                    )}
                  </div>
                )}

                {/* Entries list */}
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
                    Entries ({comp.entries?.length || 0})
                  </p>
                  {comp.entries && comp.entries.length > 0 ? (
                    comp.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          "rounded-xl border p-4 flex items-center justify-between",
                          entry.id === comp.winner_entry_id
                            ? "border-yellow-500/30 bg-yellow-500/5"
                            : "border-white/10 bg-white/5"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {entry.id === comp.winner_entry_id && (
                              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                            )}
                            <span className="text-sm text-white">{entry.title}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {entry.user?.name || "Unknown"} - {entry.vote_count || 0} votes
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={entry.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-white transition-all"
                            title="GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {entry.project_url && (
                            <a
                              href={entry.project_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-white transition-all"
                              title="Live demo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {(comp.status === "voting" || comp.status === "ended") && (
                            <button
                              onClick={() => handleSelectWinner(comp.id, "manual", entry.id)}
                              disabled={loading === comp.id}
                              className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs hover:bg-yellow-500/20 transition-all disabled:opacity-50"
                            >
                              Pick Winner
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600">No entries yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {competitions.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No competitions yet. Create one to get started.</p>
        </div>
      )}
    </div>
  );
}
