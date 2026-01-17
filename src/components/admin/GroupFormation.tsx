"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateGroups, updateGroupStatus } from "@/lib/actions/groups";
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
    <div className="space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cursor-purple/10 flex items-center justify-center text-2xl">
                👥
              </div>
              <div>
                <p className="text-2xl font-bold">{intakes.length}</p>
                <p className="text-sm text-gray-500">Intake Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">
                ✨
              </div>
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-sm text-gray-500">Suggested Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Button
              onClick={handleGenerate}
              disabled={generating || intakes.length < 2}
              size="lg"
              loading={generating}
            >
              {generating ? "Generating..." : "Generate Groups with AI"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Intake Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendee Goals & Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {intakes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No intake responses yet. Attendees will submit their goals and offers after checking in.
            </p>
          ) : (
            <div className="divide-y dark:divide-gray-800">
              {intakes.map((intake) => (
                <div key={intake.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="font-medium mb-2">{intake.user?.name || "Anonymous"}</p>
                  <div className="flex flex-wrap gap-2">
                    {intake.goals.map((goal) => (
                      <Badge key={goal} variant="secondary" className="gap-1">
                        🎯 {GOAL_LABELS[goal] || goal}
                      </Badge>
                    ))}
                    {intake.goals_other && (
                      <Badge variant="secondary" className="gap-1">
                        🎯 {intake.goals_other}
                      </Badge>
                    )}
                    {intake.offers.map((offer) => (
                      <Badge key={offer} variant="outline" className="gap-1">
                        🤝 {OFFER_LABELS[offer] || offer}
                      </Badge>
                    ))}
                    {intake.offers_other && (
                      <Badge variant="outline" className="gap-1">
                        🤝 {intake.offers_other}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Groups */}
      {groups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Suggested Groups</h2>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface GroupCardProps {
  group: SuggestedGroup;
  onStatusChange: (groupId: string, status: GroupStatus) => void;
}

function GroupCard({ group, onStatusChange }: GroupCardProps) {
  const statusColors: Record<GroupStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    modified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{group.description}</p>
          </div>
          <Badge className={statusColors[group.status]}>{group.status}</Badge>
        </div>

        {/* Members */}
        <div className="space-y-2 mb-4">
          {group.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <span className="font-medium">{member.user?.name || "Unknown"}</span>
              <span className="text-sm text-gray-500">{member.match_reason}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {group.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onStatusChange(group.id, "approved")}
            >
              ✓ Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(group.id, "modified")}
            >
              ✎ Modify
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatusChange(group.id, "rejected")}
            >
              ✕ Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
