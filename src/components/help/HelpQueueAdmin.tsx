"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { HelpRequest } from "@/types";
import { HelpRequestCard } from "./HelpRequestCard";
import { claimHelpRequest, resolveHelpRequest } from "@/lib/actions/help";

interface HelpQueueAdminProps {
  initialRequests: HelpRequest[];
  eventId: string;
  eventSlug: string;
  adminCode?: string;
}

type TabKey = "waiting" | "helping" | "resolved";

const tabs: { key: TabKey; label: string }[] = [
  { key: "waiting", label: "Waiting" },
  { key: "helping", label: "Helping" },
  { key: "resolved", label: "Resolved" },
];

export function HelpQueueAdmin({ initialRequests, eventId, eventSlug, adminCode }: HelpQueueAdminProps) {
  const [requests, setRequests] = useState<HelpRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<TabKey>("waiting");
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
      .channel(`help-requests-admin-${eventId}`)
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
  }, [eventId]);

  const handleClaim = async (requestId: string) => {
    setLoadingId(requestId);
    await claimHelpRequest(requestId, eventId, eventSlug, adminCode);
    setLoadingId(null);
  };

  const handleResolve = async (requestId: string) => {
    setLoadingId(requestId);
    await resolveHelpRequest(requestId, eventId, eventSlug, adminCode);
    setLoadingId(null);
  };

  const waiting = requests.filter((req) => req.status === "waiting");
  const helping = requests.filter((req) => req.status === "helping");
  const resolved = requests.filter((req) => req.status === "resolved" || req.status === "cancelled");

  const tabCounts: Record<TabKey, number> = {
    waiting: waiting.length,
    helping: helping.length,
    resolved: resolved.length,
  };

  const activeList = activeTab === "waiting" ? waiting : activeTab === "helping" ? helping : resolved;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      <div className="glass rounded-[40px] p-8 border border-white/[0.05]">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold transition-all border",
                activeTab === tab.key
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.02] text-gray-500 border-white/10 hover:text-white"
              )}
            >
              {tab.label} ({tabCounts[tab.key]})
            </button>
          ))}
        </div>
      </div>

      {activeList.length === 0 ? (
        <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-[40px] border-dashed opacity-40">
          <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em] font-medium">
            No requests in this queue
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeList.map((request) => (
            <HelpRequestCard
              key={request.id}
              request={request}
              actions={
                request.status === "waiting" ? (
                  <button
                    onClick={() => handleClaim(request.id)}
                    disabled={loadingId === request.id}
                    className="w-full h-12 rounded-full bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Claim
                  </button>
                ) : request.status === "helping" ? (
                  <button
                    onClick={() => handleResolve(request.id)}
                    disabled={loadingId === request.id}
                    className="w-full h-12 rounded-full bg-white/5 border border-white/10 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Resolve
                  </button>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
