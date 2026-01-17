import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getEventStats, getEventAttendees } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { AttendeeCheckinForm } from "@/components/forms/AttendeeCheckinForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { MapPin, Calendar, Users } from "lucide-react";

interface EventPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  // Check if already registered
  const session = await getSession();
  if (session && session.eventId === event.id) {
    redirect(`/${eventSlug}/agenda`);
  }

  const [stats, attendees] = await Promise.all([
    getEventStats(event.id),
    getEventAttendees(event.id),
  ]);
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
        {/* Capacity Card - only show if there are registrations */}
        {stats.registered > 0 && (
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
                      {stats.checkedIn}
                      <span className="text-gray-400 font-normal text-base">
                        {" "}
                        / {stats.registered} checked in
                      </span>
                    </p>
                  </div>
                </div>
                <Badge variant="success">{stats.registered} registered</Badge>
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
        )}

        {/* Check-in Card */}
        <Card className="shadow-xl animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Check In</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Find your name to access the event portal
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {attendees.length > 0 ? (
              <AttendeeCheckinForm
                eventId={event.id}
                eventSlug={eventSlug}
                attendees={attendees}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="font-medium">No attendees registered yet</p>
                <p className="text-sm mt-1">
                  Registrations will appear here once imported from Luma.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Entry for Testing */}
        <Card className="mt-4 border-dashed border-2 border-gray-300 dark:border-gray-700 shadow-none animate-slide-up" style={{ animationDelay: "150ms" }}>
          <CardContent className="p-4">
            <form action={`/${eventSlug}/intake`}>
              <input type="hidden" name="bypass" value="true" />
              <button
                formAction={async () => {
                  "use server";
                  const { createServiceClient } = await import("@/lib/supabase/server");
                  const { cookies } = await import("next/headers");
                  const { redirect } = await import("next/navigation");

                  const supabase = await createServiceClient();

                  // Create test user
                  const { data: user } = await supabase
                    .from("users")
                    .insert({ name: "Test User", role: "attendee" })
                    .select("id")
                    .single();

                  if (user) {
                    // Create registration
                    const eventData = await supabase
                      .from("events")
                      .select("id")
                      .eq("slug", eventSlug)
                      .single();

                    if (eventData.data) {
                      await supabase.from("registrations").insert({
                        event_id: eventData.data.id,
                        user_id: user.id,
                        consent_at: new Date().toISOString(),
                        source: "walk-in",
                        checked_in_at: new Date().toISOString(),
                      });

                      // Set session
                      const cookieStore = await cookies();
                      cookieStore.set("portal_session", JSON.stringify({
                        userId: user.id,
                        eventId: eventData.data.id,
                        exp: Date.now() + 24 * 60 * 60 * 1000,
                      }), {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 24 * 60 * 60,
                      });
                    }
                  }

                  redirect(`/${eventSlug}/intake`);
                }}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors text-sm"
              >
                Quick Entry (Testing)
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Info text */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Not on the list? Make sure you registered on{" "}
            <span className="font-semibold text-cursor-purple">Luma</span>
          </p>
        </div>
      </div>
    </main>
  );
}
