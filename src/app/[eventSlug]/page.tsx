import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getEventStats } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { MapPin, Calendar, Users } from "lucide-react";

interface EventPageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ code?: string }>;
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { eventSlug } = await params;
  const { code } = await searchParams;

  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  // Check if already registered
  const session = await getSession();
  if (session && session.eventId === event.id) {
    redirect(`/${eventSlug}/agenda`);
  }

  const stats = await getEventStats(event.id);
  const spotsLeft = event.capacity - stats.registered;
  const isFull = spotsLeft <= 0;
  const capacityPercent = Math.min((stats.registered / event.capacity) * 100, 100);

  return (
    <main className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-cursor-purple via-cursor-purple-dark to-purple-900 text-white">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-16">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
              <span className="text-4xl font-bold">C</span>
            </div>
          </div>

          {/* Event Title */}
          <h1 className="text-3xl font-bold text-center mb-2 text-balance">
            {event.name}
          </h1>

          {/* Event Details */}
          <div className="flex flex-col items-center gap-2 mt-6">
            {event.start_time && (
              <div className="flex items-center gap-2 text-white/90">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {formatDate(event.start_time)} · {formatTime(event.start_time)}
                </span>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{event.venue}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-lg mx-auto px-4 -mt-8 pb-12">
        {/* Capacity Card */}
        <Card className="mb-6 overflow-hidden shadow-xl animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cursor-purple/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cursor-purple" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Attendees
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats.registered}
                    <span className="text-gray-400 font-normal text-base">
                      {" "}
                      / {event.capacity}
                    </span>
                  </p>
                </div>
              </div>
              {isFull ? (
                <Badge variant="destructive">Event Full</Badge>
              ) : spotsLeft <= 50 ? (
                <Badge variant="warning">{spotsLeft} spots left</Badge>
              ) : (
                <Badge variant="success">Open</Badge>
              )}
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cursor-purple to-cursor-purple-dark rounded-full transition-all duration-700 ease-out"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Registration Card */}
        <Card className="shadow-xl animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {isFull ? "Join Waitlist" : "Register Now"}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isFull
                ? "Get notified when spots open up"
                : "Secure your spot at the event"}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <RegistrationForm eventId={event.id} eventSlug={eventSlug} />
          </CardContent>
        </Card>

        {/* Already Registered Link */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already registered?{" "}
            <Link
              href={`/${eventSlug}/login`}
              className="text-cursor-purple hover:text-cursor-purple-dark font-semibold transition-colors"
            >
              Sign in here →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
