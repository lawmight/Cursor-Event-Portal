"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event, Announcement } from "@/types";
import { ArrowLeft, Megaphone, Trash2, Send } from "lucide-react";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

interface AnnouncementsClientProps {
  event: Event;
  initialAnnouncements: Announcement[];
}

export function AnnouncementsClient({
  event,
  initialAnnouncements,
}: AnnouncementsClientProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [newContent, setNewContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handlePublish = async () => {
    if (!newContent.trim()) return;

    startTransition(async () => {
      const response = await fetch(`/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          content: newContent.trim(),
        }),
      });

      if (response.ok) {
        const newAnnouncement = await response.json();
        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        setNewContent("");
        router.refresh();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        router.refresh();
      }
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/admin/${event.slug}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            Announcements
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* New Announcement */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cursor-purple" />
              New Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Type your announcement..."
              rows={3}
            />
            <Button
              onClick={handlePublish}
              disabled={isPending || !newContent.trim()}
              loading={isPending}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Publish Announcement
            </Button>
          </CardContent>
        </Card>

        {/* Previous Announcements */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Published Announcements
          </h2>

          {announcements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Megaphone className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No announcements yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white mb-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Published at {formatTime(announcement.published_at!)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(announcement.id)}
                        disabled={isPending}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
