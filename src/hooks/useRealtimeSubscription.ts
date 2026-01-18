"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RealtimeChannelState } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface SubscriptionConfig {
  table: string;
  event?: PostgresEvent;
  filter?: string;
  onEvent?: () => void;
}

interface UseRealtimeSubscriptionOptions {
  eventId: string;
  subscriptions: SubscriptionConfig[];
  channelName?: string;
  autoRefresh?: boolean;
}

/**
 * Hook for subscribing to Supabase Realtime database changes
 * 
 * @param options Configuration for the realtime subscription
 * @returns void
 * 
 * @example
 * useRealtimeSubscription({
 *   eventId: event.id,
 *   subscriptions: [
 *     { table: "polls", event: "*" },
 *     { table: "poll_votes", event: "*" },
 *   ],
 *   autoRefresh: true,
 * });
 */
export function useRealtimeSubscription({
  eventId,
  subscriptions,
  channelName,
  autoRefresh = true,
}: UseRealtimeSubscriptionOptions) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const name = channelName || `realtime-${eventId}-${Date.now()}`;

    let channel: any = supabase.channel(name);

    subscriptions.forEach((config) => {
      const filter = config.filter || `event_id=eq.${eventId}`;
      
      channel = channel.on(
        "postgres_changes",
        {
          event: config.event || "*",
          schema: "public",
          table: config.table,
          filter,
        },
        async () => {
          if (config.onEvent) {
            config.onEvent();
          }
          if (autoRefresh) {
            router.refresh();
          }
        }
      );
    });

    channel.subscribe((status: RealtimeChannelState) => {
      if (status === "SUBSCRIBED") {
        console.log(`[Realtime] Subscribed to ${name}`);
      } else if (status === "CHANNEL_ERROR") {
        console.error(`[Realtime] Error subscribing to ${name}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, subscriptions, channelName, autoRefresh, router]);
}

/**
 * Hook for subscribing to a single table's changes
 * Simplified version of useRealtimeSubscription for common use cases
 */
export function useTableRealtime(
  eventId: string,
  table: string,
  onEvent?: () => void
) {
  return useRealtimeSubscription({
    eventId,
    subscriptions: [{ table, event: "*", onEvent }],
    channelName: `${table}-${eventId}`,
  });
}

