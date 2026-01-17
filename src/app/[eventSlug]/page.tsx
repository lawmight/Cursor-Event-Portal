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
    <main className="min-h-screen bg-black-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md z-10 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 floating">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-3xl items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-4">
            <span className="text-4xl font-bold text-white tracking-tighter">C</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-medium text-white tracking-tight text-shadow-glow">
              {event.name}
            </h1>
            <div className="flex flex-col items-center gap-1 text-gray-500 text-sm font-light tracking-wide">
              {event.start_time && (
                <p>
                  {formatDate(event.start_time)} · {formatTime(event.start_time)}
                </p>
              )}
              {event.venue && <p className="opacity-50 text-[10px] uppercase tracking-[0.3em] mt-1">{event.venue}</p>}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="glass rounded-[40px] p-10 border-white/[0.05] shadow-2xl animate-slide-up relative">
          {/* Subtle line at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Check-in Section */}
          <div className="space-y-4">
            {attendees.length > 0 ? (
              <AttendeeCheckinForm
                eventId={event.id}
                eventSlug={eventSlug}
                attendees={attendees}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full mx-auto animate-ping mb-4" />
                <p className="text-gray-400 font-light tracking-tight">Syncing registrations...</p>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Stats - Floating indicator */}
        {stats.registered > 0 && (
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
                {stats.checkedIn} / {stats.registered} Present
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-[10px] text-gray-700 uppercase tracking-[0.3em] font-light">
            Access Portal via <span className="text-white/40 font-semibold">Luma</span>
          </p>
        </div>
      </div>
    </main>
  );
}
