"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateGroups, updateGroupStatus, updateGroupTableNumber, removeGroupMember, cancelGroup } from "@/lib/actions/groups";
import { X } from "lucide-react";
import Image from "next/image";
import type { SuggestedGroup, AttendeeIntake, GroupStatus } from "@/types";

interface GroupFormationProps {
  eventId: string;
  eventSlug: string;
  adminCode?: string;
  intakes: AttendeeIntake[];
  groups: SuggestedGroup[];
}

const GOAL_LABELS: Record<string, string> = {
  "learn-ai": "Learn AI/ML",
  "learn-coding": "Coding",
  "networking": "Networking",
  "find-cofounders": "Cofounders",
  "hire-talent": "Hiring",
  "find-job": "Job Search",
  "explore-tools": "Tools",
  "other": "Other",
};

const OFFER_LABELS: Record<string, string> = {
  "ai-expertise": "AI/ML",
  "software-dev": "Dev",
  "design": "Design",
  "business-strategy": "Business",
  "funding-investment": "Funding",
  "mentorship": "Mentorship",
  "collaboration": "Collab",
  "other": "Other",
};

export function GroupFormation({
  eventId,
  eventSlug,
  intakes,
  groups,
}: GroupFormationProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSuccessMessage(null);
    setProgressMessage("Initializing group generation...");

    try {
      // Set progress messages at different stages
      const progressTimeout = setTimeout(() => {
        setProgressMessage("Analyzing attendee data and generating matches... This may take 30-60 seconds.");
      }, 2000);

      const result = await generateGroups(eventId, eventSlug);

      clearTimeout(progressTimeout);

      if (result.error) {
        setError(result.error);
        setProgressMessage(null);
        setWarningMessage(null);
      } else {
        setProgressMessage("Finalizing groups...");
        // Wait a moment for database to sync
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh to show the new groups
        setTimeout(() => {
          router.refresh();
        }, 0);
        
        // Show success or warning message
        if (result.warning) {
          setWarningMessage(result.warning);
          setSuccessMessage(`Generated ${result.groupCount || 0} group proposals (with warnings)`);
        } else {
          setSuccessMessage(`Successfully generated ${result.groupCount || 0} group proposals!`);
        }
        setProgressMessage(null);
        
        // Clear messages after 8 seconds
        setTimeout(() => {
          setSuccessMessage(null);
          setWarningMessage(null);
        }, 8000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(`Failed to generate groups: ${errorMessage}`);
      setProgressMessage(null);
      
      // Even if there was an error, check if groups were actually created
      // (in case of timeout but job completed)
      setTimeout(async () => {
        router.refresh();
      }, 1000);
    } finally {
      setGenerating(false);
      // Clear progress message after a delay
      setTimeout(() => {
        setProgressMessage(null);
      }, 2000);
    }
  };

  const handleStatusChange = async (groupId: string, status: GroupStatus) => {
    const result = await updateGroupStatus(groupId, status, eventSlug);
    if (result.error) {
      setError(result.error);
    } else {
      setTimeout(() => {
        router.refresh();
      }, 0);
    }
  };

  const handleMemberRemove = async (groupId: string, userId: string) => {
    const result = await removeGroupMember(groupId, userId, eventSlug);
    if (result.error) {
      setError(result.error);
    } else {
      setTimeout(() => {
        router.refresh();
      }, 0);
    }
  };

  const handleGroupCancel = async (groupId: string) => {
    const result = await cancelGroup(groupId, eventSlug);
    if (result.error) {
      setError(result.error);
    } else {
      setTimeout(() => {
        router.refresh();
      }, 0);
    }
  };

  return (
    <div className="space-y-12">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-[32px] p-8 border-white/[0.03] group hover:bg-white/[0.01] transition-colors">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all overflow-hidden flex-shrink-0">
              <Image
                src="/attendees.png"
                alt="Attendees"
                width={40}
                height={40}
                className="object-contain opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="flex-1">
              <p className="text-4xl font-light tracking-tight tabular-nums">{intakes.length}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mt-1">Intake Responses</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-[32px] p-8 border-white/[0.03] group hover:bg-white/[0.01] transition-colors">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all overflow-hidden flex-shrink-0">
              <Image
                src="/proposals.png"
                alt="Proposals"
                width={40}
                height={40}
                className="object-contain opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="flex-1">
              <p className="text-4xl font-light tracking-tight tabular-nums">{groups.length}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mt-1">Proposals</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-[32px] p-8 border-white/[0.03] group hover:bg-white/[0.01] transition-colors">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all overflow-hidden flex-shrink-0">
              <Image
                src="/group-synthesis.png"
                alt="Synthesize"
                width={40}
                height={40}
                className="object-contain opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="flex-1">
              <button
                onClick={handleGenerate}
                disabled={generating || intakes.length < 2}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                  generating || intakes.length < 2
                    ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                    : "bg-white/[0.03] text-white/90 border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.08] hover:text-white hover:scale-[1.02] shadow-xl active:scale-[0.98]"
                }`}
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="animate-pulse">{progressMessage ? "Generating..." : "Processing..."}</span>
                  </>
                ) : (
                  <span>Synthesize Groups</span>
                )}
                
                {/* Subtle shimmer effect on hover */}
                {!generating && intakes.length >= 2 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover/btn:animate-shimmer pointer-events-none" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {progressMessage && generating && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-6 rounded-[24px] text-sm tracking-tight">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
            <span>{progressMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-[24px] text-sm tracking-tight">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {warningMessage && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-6 rounded-[24px] text-sm tracking-tight">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span>{warningMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-[24px] text-sm tracking-tight">
          {error}
        </div>
      )}

      {/* Intake Summary */}
      <div className="glass rounded-[40px] p-10 border-white/[0.03]">
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-[11px] uppercase tracking-[0.5em] text-gray-500 font-medium">Input Matrix</h3>
          <div className="h-[1px] flex-1 bg-white/[0.03]" />
        </div>
        
        {intakes.length === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-800 text-center py-8 text-sm uppercase tracking-[0.2em] font-medium">
              Awaiting attendee data transmissions
            </p>
            <p className="text-gray-700 text-center text-xs tracking-tight leading-relaxed max-w-2xl mx-auto">
              Attendees submit their networking goals and offers through the intake form. Once they complete it, their data will appear here for group formation analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {intakes.map((intake) => (
              <div key={intake.id} className="p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-light tracking-tight text-white/90">{intake.user?.name || "Unknown Identity"}</p>
                    {intake.user?.role === "admin" && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center" title="Admin">
                        <span className="text-[10px] font-bold text-white">A</span>
                      </div>
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-white/40 transition-colors shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {intake.goals.map((goal) => (
                    <span key={goal} className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-[10px] uppercase tracking-[0.15em] text-gray-500 font-medium">
                      {GOAL_LABELS[goal] || goal}
                    </span>
                  ))}
                  {intake.goals_other && (
                    <span className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-[10px] uppercase tracking-[0.15em] text-gray-500 font-medium">
                      {intake.goals_other}
                    </span>
                  )}
                  {intake.offers.map((offer) => (
                    <span key={offer} className="px-4 py-1.5 rounded-full bg-white text-black text-[10px] uppercase tracking-[0.15em] font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      {OFFER_LABELS[offer] || offer}
                    </span>
                  ))}
                  {intake.offers_other && (
                    <span className="px-4 py-1.5 rounded-full bg-white text-black text-[10px] uppercase tracking-[0.15em] font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      {intake.offers_other}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Groups */}
      {groups.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] uppercase tracking-[0.5em] text-gray-500 font-medium">Proposed Formations</h2>
            <div className="h-[1px] flex-1 bg-white/[0.03]" />
          </div>
          <div className="space-y-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                eventSlug={eventSlug}
                onStatusChange={handleStatusChange}
                onMemberRemove={handleMemberRemove}
                onGroupCancel={handleGroupCancel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GroupCardProps {
  group: SuggestedGroup;
  eventSlug: string;
  onStatusChange: (groupId: string, status: GroupStatus) => void;
  onMemberRemove: (groupId: string, userId: string) => void;
  onGroupCancel: (groupId: string) => void;
}

function GroupCard({ group, eventSlug, onStatusChange, onMemberRemove, onGroupCancel }: GroupCardProps) {
  const router = useRouter();
  const [editingTableNumber, setEditingTableNumber] = useState(false);
  const [tableNumber, setTableNumber] = useState<string>(group.table_number?.toString() || "");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const handleTableNumberChange = async (newValue: string) => {
    const numValue = newValue === "" ? null : parseInt(newValue, 10);
    if (numValue !== null && (isNaN(numValue) || numValue < 1)) {
      return; // Invalid number
    }
    
    const result = await updateGroupTableNumber(group.id, numValue, eventSlug);
    if (result.error) {
      alert(result.error);
      setTableNumber(group.table_number?.toString() || "");
    } else {
      setTimeout(() => {
        router.refresh();
      }, 0);
    }
    setEditingTableNumber(false);
  };
  const statusColors: Record<GroupStatus, string> = {
    pending: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    approved: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    modified: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    rejected: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="glass rounded-[48px] p-10 border-white/[0.03] hover:bg-white/[0.01] transition-all group">
      <div className="flex items-start justify-between mb-10">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-4 flex-wrap">
            <h3 className="text-3xl font-light tracking-tight text-white/90">{group.name}</h3>
            {editingTableNumber ? (
              <input
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                onBlur={() => handleTableNumberChange(tableNumber)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTableNumberChange(tableNumber);
                  } else if (e.key === "Escape") {
                    setTableNumber(group.table_number?.toString() || "");
                    setEditingTableNumber(false);
                  }
                }}
                className="w-20 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-lg font-light focus:outline-none focus:border-white/40"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditingTableNumber(true)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 text-lg font-light hover:bg-white/20 transition-colors"
              >
                {group.table_number ? `Table ${group.table_number}` : "Assign Table"}
              </button>
            )}
            {group.match_score !== null && group.match_score !== undefined && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">Match Score</span>
                <span className={`text-lg font-light tabular-nums ${
                  group.match_score >= 80 ? "text-emerald-400" :
                  group.match_score >= 60 ? "text-amber-400" :
                  "text-red-400"
                }`}>
                  {group.match_score.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-700 text-sm tracking-tight leading-relaxed max-w-xl">{group.description}</p>
        </div>
        <span className={`px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold border ${statusColors[group.status]}`}>
          {group.status}
        </span>
      </div>

      {/* Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {group.members?.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-2 p-6 bg-white/[0.01] border border-white/[0.03] rounded-[32px] hover:bg-white/[0.03] transition-all relative group/member"
            >
              {/* Remove member button */}
              {removingMemberId === member.user_id ? (
                <div className="absolute top-3 right-3 flex items-center gap-2 animate-fade-in">
                  <button
                    onClick={() => {
                      onMemberRemove(group.id, member.user_id);
                      setRemovingMemberId(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase tracking-[0.1em] hover:bg-red-500/30 transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setRemovingMemberId(null)}
                    className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 text-[9px] font-bold uppercase tracking-[0.1em] hover:text-white transition-all"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRemovingMemberId(member.user_id)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/[0.02] border border-white/[0.05] text-gray-700 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center opacity-0 group-hover/member:opacity-100"
                  title="Remove from group"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-center gap-2 pr-10">
                <span className="text-lg font-light tracking-tight text-white/90">{member.user?.name || "Unknown"}</span>
                {member.user?.role === "admin" && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center" title="Admin">
                    <span className="text-[10px] font-bold text-white">A</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-[0.1em] text-gray-800 font-medium">{member.match_reason}</span>
            </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 pt-4">
        {group.status === "pending" && (
          <>
            <button
              onClick={() => onStatusChange(group.id, "approved")}
              className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Approve Formation
            </button>
            <button
              onClick={() => onStatusChange(group.id, "modified")}
              className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Modify
            </button>
            <button
              onClick={() => onStatusChange(group.id, "rejected")}
              className="px-8 py-3 text-gray-800 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-widest"
            >
              Discard
            </button>
          </>
        )}

        {group.status === "rejected" && (
          <button
            onClick={() => onGroupCancel(group.id)}
            className="px-8 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all"
          >
            Permanently Remove
          </button>
        )}

        {(group.status === "approved" || group.status === "modified") && (
          <>
            {confirmCancel ? (
              <div className="flex items-center gap-3 animate-fade-in">
                <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Cancel this group?</span>
                <button
                  onClick={() => {
                    onGroupCancel(group.id);
                    setConfirmCancel(false);
                  }}
                  className="px-6 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-red-500/30 transition-all"
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-full font-bold text-xs uppercase tracking-widest hover:text-white transition-all"
                >
                  No
                </button>
              </div>
            ) : (
              <>
                {group.status === "modified" && (
                  <button
                    onClick={() => onStatusChange(group.id, "approved")}
                    className="px-8 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    Approve Changes
                  </button>
                )}
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="px-8 py-3 text-gray-700 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  Cancel Group
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
