import { getQuestionsForAdmin, getAllPolls, getAnnouncements, getAllSurveys, getHelpRequestsForAdmin } from "@/lib/supabase/queries";
import { EventSocialClient } from "../../_clients/[adminCode]/social/EventSocialClient";
import { getEventForAdmin } from "@/lib/utils/admin";

interface EventSocialPageProps {
  params: Promise<{ adminCode: string }>;
  searchParams: Promise<{ sort?: string; status?: string; tab?: string }>;
}

export default async function EventSocialPage({ params, searchParams }: EventSocialPageProps) {
  const { adminCode } = await params;
  const { sort, status, tab } = await searchParams;
  const event = await getEventForAdmin(adminCode);

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
      eventSlug={event.slug}
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
