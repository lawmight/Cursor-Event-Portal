"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { HelpRequest } from "@/types";
import { HelpRequestCard } from "./HelpRequestCard";

interface HelpRequestListProps {
  initialRequests: HelpRequest[];
  eventId: string;
  userId?: string;
}

export function HelpRequestList({ initialRequests, eventId, userId }: HelpRequestListProps) {
  const [requests, setRequests] = useState<HelpRequest[]>(initialRequests);

  useEffect(() => {
    const supabase = createClient();

    const fetchRequest = async (id: string) => {
      const { data } = await supabase
        .from("help_requests")
        .select("*, user:users!help_requests_user_id_fkey(*), claimer:users!help_requests_claimed_by_fkey(*)")
        .eq("id", id)
        .single();
      return data as HelpRequest | null;
    };

    const channel = supabase
      .channel(`help-requests-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "help_requests",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const newRequest = await fetchRequest(payload.new.id);
          if (!newRequest) return;
          if (userId && newRequest.user_id !== userId) return;
          setRequests((prev) => {
            if (prev.some((req) => req.id === newRequest.id)) return prev;
            return [newRequest, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "help_requests",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const updated = await fetchRequest(payload.new.id);
          if (!updated) return;
          if (userId && updated.user_id !== userId) return;
          setRequests((prev) => {
            const index = prev.findIndex((req) => req.id === updated.id);
            if (index >= 0) {
              const next = [...prev];
              next[index] = updated;
              return next;
            }
            return [updated, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "help_requests",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setRequests((prev) => prev.filter((req) => req.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, userId]);

  const sorted = [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (sorted.length === 0) {
    return (
      <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-[40px] border-dashed opacity-40">
        <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em] font-medium">
          No help requests yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      {sorted.map((request) => (
        <HelpRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}
