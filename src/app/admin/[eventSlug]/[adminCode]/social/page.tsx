import { notFound } from "next/navigation";
import { getEventBySlug, getQuestionsForAdmin, getAllPolls, getAnnouncements, getAllSurveys, getHelpRequestsForAdmin } from "@/lib/supabase/queries";
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

  const sortBy = sort === "new" ? "new" : "trending";
  const statusFilter = (status === "answered" || status === "hidden" || status === "pinned" || status === "open") ? status : "all";
  const activeTab = (tab === "help" || tab === "surveys" || tab === "polls" || tab === "announcements") ? tab : "qa";

  const [questions, polls, announcements, surveys, helpRequests] = await Promise.all([
    getQuestionsForAdmin(event.id, sortBy, true),
    getAllPolls(event.id),
    getAnnouncements(event.id),
    getAllSurveys(event.id),
    getHelpRequestsForAdmin(event.id),
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
      initialHelpRequests={helpRequests}
      sortBy={sortBy}
      statusFilter={statusFilter as any}
      activeTab={activeTab as any}
    />
  );
}
