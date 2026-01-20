import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getQuestionsForAdmin, getAllPolls, getAnnouncements, getAllSurveys } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { EventSocialClient } from "./EventSocialClient";

interface EventSocialPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
  searchParams: Promise<{ sort?: string; status?: string; tab?: string }>;
}

export default async function EventSocialPage({ params, searchParams }: EventSocialPageProps) {
  const { eventSlug, adminCode } = await params;
  const { sort, status, tab } = await searchParams;

  const event = await getEventBySlug(eventSlug);
  if (!event || event.admin_code !== adminCode) {
    notFound();
  }

  // Check if admin
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

  const sortBy = sort === "new" ? "new" : "trending";
  const statusFilter = (status === "answered" || status === "hidden" || status === "pinned" || status === "open") ? status : "all";
  const activeTab = (tab === "surveys" || tab === "polls" || tab === "announcements") ? tab : "qa";

  // Fetch all data in parallel
  const [questions, polls, announcements, surveys] = await Promise.all([
    getQuestionsForAdmin(event.id, sortBy, true),
    getAllPolls(event.id),
    getAnnouncements(event.id),
    getAllSurveys(event.id)
  ]);

  return (
    <EventSocialClient 
      event={event}
      eventSlug={eventSlug} 
      adminCode={adminCode}
      userId={session.userId}
      initialQuestions={questions}
      initialPolls={polls}
      initialAnnouncements={announcements}
      initialSurveys={surveys}
      sortBy={sortBy}
      statusFilter={statusFilter as any}
      activeTab={activeTab as any}
    />
  );
}
