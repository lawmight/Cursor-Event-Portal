"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DisplayPageData, Question } from "@/types";

interface EventDisplayProps {
  initialData: DisplayPageData;
  eventSlug: string;
  refreshInterval?: number;
}

export function EventDisplay({
  initialData,
  eventSlug,
  refreshInterval = 30000,
}: EventDisplayProps) {
  const [data, setData] = useState(initialData);
  const [countdown, setCountdown] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Refresh data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/display/${eventSlug}`);
        if (res.ok) {
          const newData = await res.json();
          setData(newData);
        }
      } catch (error) {
        console.error("Failed to refresh display data");
      }
    };

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [eventSlug, refreshInterval]);

  // Update countdown and current time every second
  useEffect(() => {
    const updateCountdown = () => {
      setCurrentTime(new Date());

      if (!data.nextSession?.start_time) {
        setCountdown("");
        return;
      }

      const now = new Date();
      const start = new Date(data.nextSession.start_time);
      const diff = start.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Starting now!");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data.nextSession]);

  // Calculate progress for current session
  const getSessionProgress = (): number => {
    if (!data.currentSession?.start_time || !data.currentSession?.end_time) {
      return 0;
    }
    const now = new Date().getTime();
    const start = new Date(data.currentSession.start_time).getTime();
    const end = new Date(data.currentSession.end_time).getTime();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-2">{data.event.name}</h1>
        <p className="text-xl text-gray-400">{data.event.venue}</p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
        {/* Current Session - Takes 2 columns */}
        <div className="col-span-2 space-y-8">
          {/* Now Playing */}
          {data.currentSession ? (
            <Card className="bg-gradient-to-br from-green-900/50 to-green-950/50 border-green-700 p-8">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-green-500 text-white text-lg px-4 py-1 animate-pulse">
                  NOW
                </Badge>
              </div>
              <h2 className="text-4xl font-bold mb-4">{data.currentSession.title}</h2>
              {data.currentSession.speaker && (
                <p className="text-2xl text-gray-300 mb-6">
                  {data.currentSession.speaker}
                </p>
              )}
              {data.currentSession.description && (
                <p className="text-xl text-gray-400 mb-6">
                  {data.currentSession.description}
                </p>
              )}
              {/* Progress bar */}
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${getSessionProgress()}%` }}
                />
              </div>
            </Card>
          ) : (
            <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
              <p className="text-2xl text-gray-400">No session in progress</p>
            </Card>
          )}

          {/* Up Next */}
          {data.nextSession && (
            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 border-blue-700 p-8">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-blue-500 text-white text-lg px-4 py-1">
                  UP NEXT
                </Badge>
                <div className="flex items-center gap-2 text-3xl font-mono">
                  <span className="text-2xl">⏱️</span>
                  {countdown}
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2">{data.nextSession.title}</h2>
              {data.nextSession.speaker && (
                <p className="text-xl text-gray-300">{data.nextSession.speaker}</p>
              )}
            </Card>
          )}

          {/* Announcements */}
          {data.announcements.length > 0 && (
            <Card className="bg-amber-900/30 border-amber-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📢</span>
                <span className="text-lg font-semibold text-amber-400">Announcements</span>
              </div>
              <div className="space-y-3">
                {data.announcements.map((announcement) => (
                  <p key={announcement.id} className="text-xl">
                    {announcement.content}
                  </p>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Q&A Feed - Takes 1 column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">💬</span>
            <h3 className="text-2xl font-bold">Live Q&A</h3>
          </div>

          {data.recentQuestions.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-xl">No questions yet</p>
              <p className="text-sm mt-2">Scan the QR code to ask a question</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentQuestions.map((question) => (
                <QuestionDisplayCard key={question.id} question={question} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer with time */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur py-4 text-center">
        <time className="text-2xl font-mono text-gray-400">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </footer>
    </div>
  );
}

function QuestionDisplayCard({ question }: { question: Question }) {
  return (
    <Card className="bg-gray-800/50 border-gray-700 p-4">
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <span className="text-cursor-purple">▲</span>
          <span className="text-lg font-bold">{question.upvotes}</span>
        </div>
        <div className="flex-1">
          <p className="text-lg">{question.content}</p>
          <p className="text-sm text-gray-500 mt-2">
            {question.user?.name || "Anonymous"}
          </p>
        </div>
      </div>
    </Card>
  );
}
