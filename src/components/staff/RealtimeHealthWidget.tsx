"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Radio, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeHealthWidgetProps {
  eventId: string;
}

export function RealtimeHealthWidget({ eventId }: RealtimeHealthWidgetProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const testConnection = async () => {
      try {
        // Test connection with a simple query first
        const { error: queryError } = await supabase
          .from("registrations")
          .select("id")
          .eq("event_id", eventId)
          .limit(1);

        if (!queryError) {
          setLastUpdate(new Date());
        }

        // Test connection by subscribing to a channel
        channel = supabase
          .channel(`health-check-${eventId}-${Date.now()}`)
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "registrations",
            filter: `event_id=eq.${eventId}`,
          }, () => {
            setLastUpdate(new Date());
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setConnectionStatus("connected");
              setIsConnected(true);
              setLastUpdate(new Date());
              reconnectAttempts = 0;
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              setConnectionStatus("disconnected");
              setIsConnected(false);
              reconnectAttempts++;
              if (reconnectAttempts < maxReconnectAttempts) {
                setTimeout(testConnection, 2000);
              }
            } else if (status === "CLOSED") {
              setConnectionStatus("disconnected");
              setIsConnected(false);
            } else if (status === "SUBSCRIBING") {
              setConnectionStatus("connecting");
            }
          });
      } catch (error) {
        console.error("Health check error:", error);
        setConnectionStatus("disconnected");
        setIsConnected(false);
      }
    };

    testConnection();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [eventId]);

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 10) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="glass rounded-[32px] p-6 border border-white/10">
      <h3 className="text-[10px] uppercase tracking-[0.4em] font-medium text-gray-500 mb-4">
        System Health
      </h3>
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={cn(
              "w-4 h-4",
              isConnected ? "text-green-400" : "text-red-400"
            )} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500">
              Realtime
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={cn(
              "text-[10px] font-medium",
              isConnected ? "text-green-400" : "text-red-400"
            )}>
              {connectionStatus === "connected" ? "Connected" : 
               connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500">
              Last Update
            </span>
          </div>
          <span className="text-[10px] font-medium text-gray-400">
            {formatLastUpdate(lastUpdate)}
          </span>
        </div>

        {/* Queue/Backlog (placeholder for future implementation) */}
        {queueSize > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500">
              Queue
            </span>
            <span className="text-[10px] font-medium text-orange-400">
              {queueSize} pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
