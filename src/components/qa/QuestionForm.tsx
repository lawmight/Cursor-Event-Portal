"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuestion } from "@/lib/actions/questions";
import { cn } from "@/lib/utils";

interface QuestionFormProps {
  eventId: string;
  eventSlug: string;
}

const TAGS = ["Setup", "Cursor", "Prompting", "Debugging", "Other"];

export function QuestionForm({ eventId, eventSlug }: QuestionFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Please enter your question");
      return;
    }

    setLoading(true);

    try {
      const result = await createQuestion(eventId, eventSlug, {
        content: content.trim(),
        tags: selectedTags,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        setSelectedTags([]);
        setSuccess(true);
        router.refresh(); // Refresh to show the new question
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-[40px] p-10 space-y-8 animate-slide-up relative overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">
          New Inquiry
        </p>
        <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What would you like to know?"
            rows={3}
            disabled={loading}
            className="w-full bg-transparent border-b border-white/10 rounded-none py-4 text-white placeholder:text-gray-800 focus:outline-none focus:border-white/30 transition-all text-2xl font-light leading-tight resize-none"
          />
        </div>

        <div className="space-y-4">
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-700 font-medium px-1">Tags</p>
          <div className="flex flex-wrap gap-3">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] transition-all border",
                  selectedTags.includes(tag)
                    ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : "bg-white/[0.01] border-white/5 text-gray-600 hover:text-white hover:border-white/20"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-center p-4 rounded-2xl bg-red-500/5 text-red-400/80 text-[10px] font-medium uppercase tracking-widest animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="text-center p-4 rounded-2xl bg-green-500/5 text-green-400/80 text-[10px] font-medium uppercase tracking-widest animate-fade-in">
            Sent successfully
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !content.trim()}
          className="w-full h-16 rounded-full bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]"
        >
          {loading ? "..." : "Send Question"}
        </button>
      </form>
    </div>
  );
}
