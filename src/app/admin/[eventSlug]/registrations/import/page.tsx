import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEventBySlug, getEventRegistrations } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { ImportRegistrationsClient } from "./ImportRegistrationsClient";

interface ImportRegistrationsPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function ImportRegistrationsPage({
  params,
}: ImportRegistrationsPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  // Check if admin
  const session = await getSession();
  if (!session) redirect(`/${eventSlug}`);

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    redirect(`/${eventSlug}/agenda`);
  }

  const existing = await getEventRegistrations(event.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 glass border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href={`/admin/${eventSlug}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            Import Attendees (Luma)
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {event.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Paste or upload a Luma attendee CSV export to pre-load registrations.
          </p>
        </div>

        <ImportRegistrationsClient
          eventId={event.id}
          eventSlug={event.slug}
          existingEmails={existing
            .map((r) => r.user?.email?.toLowerCase())
            .filter(Boolean) as string[]}
        />
      </main>
    </div>
  );
}

