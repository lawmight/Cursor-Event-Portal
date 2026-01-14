"use client";

import { useState } from "react";
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
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ask a Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What would you like to ask?"
            rows={3}
            disabled={loading}
          />

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Tags (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-cursor-purple text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg">
              Question submitted successfully!
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Submit Question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
