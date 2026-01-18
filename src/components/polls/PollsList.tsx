"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PollCard } from "./PollCard";
import type { PollWithVotes } from "@/types";

interface PollsListProps {
  initialPolls: PollWithVotes[];
  eventId: string;
  eventSlug: string;
  userId: string;
}

export function PollsList({
  initialPolls,
  eventId,
  eventSlug,
  userId,
}: PollsListProps) {
  const router = useRouter();
  const [polls, setPolls] = useState<PollWithVotes[]>(initialPolls);

  // Subscribe to real-time poll updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`polls-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "polls",
          filter: `event_id=eq.${eventId}`,
        },
        async () => {
          // Refresh page to get new poll with vote counts
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "polls",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const updatedPoll = payload.new as any;
          
          // If poll is now inactive, remove it from the list
          if (!updatedPoll.is_active) {
            setPolls((prev) => prev.filter((p) => p.id !== updatedPoll.id));
          } else {
            // Refresh to get updated poll data
            router.refresh();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "polls",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setPolls((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    // Also listen for vote changes to update counts in real-time
    const votesChannel = supabase
      .channel(`poll-votes-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_votes",
        },
        () => {
          // Refresh to get updated vote counts
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(votesChannel);
    };
  }, [eventId, router]);

  // Update polls when initialPolls changes (from server refresh)
  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  if (polls.length === 0) {
    return (
      <div className="glass rounded-[40px] p-20 text-center space-y-4 border-dashed border-white/5 opacity-40">
        <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
          No active polls
        </p>
        <p className="text-xs text-gray-700">
          Check back when a poll is started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {polls.map((poll, index) => (
        <div
          key={poll.id}
          className="animate-slide-up"
          style={{ animationDelay: `${(index + 1) * 100}ms` }}
        >
          <PollCard poll={poll} eventSlug={eventSlug} />
        </div>
      ))}
    </div>
  );
}

