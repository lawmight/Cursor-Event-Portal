"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkIn, undoCheckIn } from "@/lib/actions/registration";
import type { Event, Registration } from "@/types";
import { Search, UserCheck, UserX, Users, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CheckInClientProps {
  event: Event;
  initialRegistrations: Registration[];
  stats: { registered: number; checkedIn: number };
}

export function CheckInClient({
  event,
  initialRegistrations,
  stats,
}: CheckInClientProps) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredRegistrations = registrations.filter((reg) => {
    const query = searchQuery.toLowerCase();
    return (
      reg.user?.name.toLowerCase().includes(query) ||
      reg.user?.email?.toLowerCase().includes(query)
    );
  });

  const checkedInCount = registrations.filter((r) => r.checked_in_at).length;

  const handleCheckIn = async (registrationId: string) => {
    setActiveId(registrationId);
    startTransition(async () => {
      const result = await checkIn(registrationId);
      if (result.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === registrationId
              ? { ...r, checked_in_at: new Date().toISOString() }
              : r
          )
        );
      }
      setActiveId(null);
    });
  };

  const handleUndoCheckIn = async (registrationId: string) => {
    setActiveId(registrationId);
    startTransition(async () => {
      const result = await undoCheckIn(registrationId);
      if (result.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === registrationId ? { ...r, checked_in_at: null } : r
          )
        );
      }
      setActiveId(null);
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
            Check-In
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cursor-purple/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cursor-purple" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {registrations.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Registered
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {checkedInCount}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Checked In
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Capacity Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Venue Capacity
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {checkedInCount} / {event.capacity}
              </span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((checkedInCount / event.capacity) * 100, 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg"
          />
        </div>

        {/* Attendee List */}
        <div className="space-y-2">
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "No attendees match your search"
                  : "No registrations yet"}
              </p>
            </div>
          ) : (
            filteredRegistrations.map((registration) => {
              const isCheckedIn = !!registration.checked_in_at;
              const isActive = activeId === registration.id;

              return (
                <Card
                  key={registration.id}
                  className={cn(
                    "transition-all duration-200",
                    isCheckedIn && "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0",
                            isCheckedIn
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}
                        >
                          {registration.user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {registration.user?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {registration.user?.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCheckedIn ? (
                          <>
                            <Badge variant="success">Checked In</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUndoCheckIn(registration.id)}
                              disabled={isPending}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleCheckIn(registration.id)}
                            disabled={isPending}
                            loading={isActive && isPending}
                            size="sm"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
