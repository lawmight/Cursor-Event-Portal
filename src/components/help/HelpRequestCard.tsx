"use client";

import type { HelpRequest } from "@/types";
import { cn } from "@/lib/utils";

interface HelpRequestCardProps {
  request: HelpRequest;
  actions?: React.ReactNode;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "just now";
}

const statusStyles: Record<HelpRequest["status"], string> = {
  waiting: "bg-amber-500/10 text-amber-300",
  helping: "bg-blue-500/10 text-blue-300",
  resolved: "bg-green-500/10 text-green-300",
  cancelled: "bg-white/10 text-gray-400",
};

export function HelpRequestCard({ request, actions }: HelpRequestCardProps) {
  return (
    <div className="glass rounded-[32px] p-8 space-y-6 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-medium">
          {request.category}
        </span>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.3em] font-medium",
            statusStyles[request.status]
          )}
        >
          {request.status}
        </span>
      </div>

      <p className="text-xl font-light tracking-tight text-white leading-relaxed">
        {request.description}
      </p>

      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-gray-600 font-medium">
        <span>{timeAgo(request.created_at)} ago</span>
        {request.status === "helping" && request.claimer?.name && (
          <span>Helping: {request.claimer.name}</span>
        )}
      </div>

      {actions && (
        <div className="pt-4 border-t border-white/5">
          {actions}
        </div>
      )}
    </div>
  );
}
