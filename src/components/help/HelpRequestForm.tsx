"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createHelpRequest } from "@/lib/actions/help";
import type { HelpCategory } from "@/types";

interface HelpRequestFormProps {
  eventId: string;
  eventSlug: string;
}

const CATEGORIES: HelpCategory[] = [
  "Debugging",
  "Design",
  "Deployment",
  "Cursor",
  "Prompting",
  "Other",
];

export function HelpRequestForm({ eventId, eventSlug }: HelpRequestFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category) {
      setError("Please choose a category");
      return;
    }

    if (!description.trim()) {
      setError("Please describe what you need help with");
      return;
    }

    setLoading(true);
    const result = await createHelpRequest(eventId, eventSlug, {
      category,
      description: description.trim(),
    });

    if (result?.error) {
      setError(result.error);
    } else {
      setDescription("");
      setCategory(null);
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }

    setLoading(false);
  };

  return (
    <div className="glass rounded-[40px] p-10 space-y-8 animate-slide-up relative overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.4em]">
          Request Help
        </p>
        <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-4">
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-medium px-1">Category</p>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setCategory(tag)}
                className={cn(
                  "px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] transition-all border",
                  category === tag
                    ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : "bg-white/[0.01] border-white/5 text-gray-600 hover:text-white hover:border-white/20"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue or question you need help with..."
            rows={4}
            disabled={loading}
            className="w-full bg-transparent border-b border-white/10 rounded-none py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-all text-2xl font-light leading-tight resize-none"
          />
        </div>

        {error && (
          <div className="text-center p-4 rounded-2xl bg-red-500/5 text-red-400/80 text-[10px] font-medium uppercase tracking-widest animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="text-center p-4 rounded-2xl bg-green-500/5 text-green-400/80 text-[10px] font-medium uppercase tracking-widest animate-fade-in">
            Request submitted
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !description.trim() || !category}
          className="w-full h-16 rounded-full bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]"
        >
          {loading ? "..." : "Send Request"}
        </button>
      </form>
    </div>
  );
}
