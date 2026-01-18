"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateGroups, updateGroupStatus, updateGroupTableNumber } from "@/lib/actions/groups";
import { Users, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import type { SuggestedGroup, AttendeeIntake, GroupStatus } from "@/types";

interface GroupFormationProps {
  eventId: string;
  eventSlug: string;
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

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    const result = await generateGroups(eventId, eventSlug);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setGenerating(false);
  };

  const handleStatusChange = async (groupId: string, status: GroupStatus) => {
    await updateGroupStatus(groupId, status, eventSlug);
    router.refresh();
  };

  return (
    <div className="space-y-12">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-[32px] p-8 border-white/[0.03] group hover:bg-white/[0.01] transition-colors">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
              <Users className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-4xl font-light tracking-tight tabular-nums">{intakes.length}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium mt-1">Intake Responses</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-[32px] p-8 border-white/[0.03] group hover:bg-white/[0.01] transition-colors">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
              <Sparkles className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-4xl font-light tracking-tight tabular-nums">{groups.length}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium mt-1">Proposals</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-[32px] p-8 border-white/[0.03] flex items-center justify-center">
          <button
            onClick={handleGenerate}
            disabled={generating || intakes.length < 2}
            className={`w-full py-4 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-3 ${
              generating || intakes.length < 2
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-white text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            }`}
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Synthesize Groups
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-[24px] text-sm tracking-tight">
          {error}
        </div>
      )}

      {/* Intake Summary */}
      <div className="glass rounded-[40px] p-10 border-white/[0.03]">
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-[11px] uppercase tracking-[0.5em] text-gray-700 font-medium">Input Matrix</h3>
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
                  <p className="text-xl font-light tracking-tight text-white/90">{intake.user?.name || "Unknown Identity"}</p>
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
            <h2 className="text-[11px] uppercase tracking-[0.5em] text-gray-700 font-medium">Proposed Formations</h2>
            <div className="h-[1px] flex-1 bg-white/[0.03]" />
          </div>
          <div className="space-y-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                eventSlug={eventSlug}
                onStatusChange={handleStatusChange}
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
}

function GroupCard({ group, eventSlug, onStatusChange }: GroupCardProps) {
  const router = useRouter();
  const [editingTableNumber, setEditingTableNumber] = useState(false);
  const [tableNumber, setTableNumber] = useState<string>(group.table_number?.toString() || "");

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
      router.refresh();
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
          <div className="flex items-center gap-4">
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
            className="flex flex-col gap-2 p-6 bg-white/[0.01] border border-white/[0.03] rounded-[32px] hover:bg-white/[0.03] transition-all"
          >
            <span className="text-lg font-light tracking-tight text-white/90">{member.user?.name || "Unknown"}</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-gray-800 font-medium">{member.match_reason}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {group.status === "pending" && (
        <div className="flex flex-wrap gap-4 pt-4">
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
        </div>
      )}
    </div>
  );
}
