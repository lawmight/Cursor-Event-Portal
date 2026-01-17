import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getEventIntakes, getSuggestedGroups } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { GroupFormation } from "@/components/admin/GroupFormation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminGroupsPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminGroupsPage({ params }: AdminGroupsPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  // Verify admin access
  const session = await getSession();
  if (!session) {
    redirect(`/${eventSlug}`);
  }

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") {
    redirect(`/${eventSlug}/agenda`);
  }

  const [intakes, groups] = await Promise.all([
    getEventIntakes(event.id),
    getSuggestedGroups(event.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-gradient-to-br from-cursor-purple via-cursor-purple-dark to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/admin/${eventSlug}`}>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-white/80">Group Formation</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <GroupFormation
          eventId={event.id}
          eventSlug={eventSlug}
          intakes={intakes}
          groups={groups}
        />
      </main>
    </div>
  );
}
