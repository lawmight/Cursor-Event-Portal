import { notFound } from "next/navigation";
import { getEventBySlug, getQuestionsForAdmin, getAllPolls, getAnnouncements, getAllSurveys } from "@/lib/supabase/queries";
import { EventSocialClient } from "./EventSocialClient";

interface EventSocialPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
  searchParams: Promise<{ sort?: string; status?: string; tab?: string }>;
}

export default async function EventSocialPage({ params, searchParams }: EventSocialPageProps) {
  const { eventSlug, adminCode } = await params;
  const { sort, status, tab } = await searchParams;

  // Validate admin code (this is sufficient for admin access)
  const event = await getEventBySlug(eventSlug);
  if (!event || event.admin_code !== adminCode) {
    notFound();
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
      userId={undefined}
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
