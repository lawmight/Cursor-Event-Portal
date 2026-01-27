import { getQuestionsForAdmin } from "@/lib/supabase/queries";
import { AdminQAClient } from "../../../[eventSlug]/qa/AdminQAClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminQAPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
  searchParams: Promise<{ sort?: string; status?: string }>;
}

export default async function AdminQAPage({ params, searchParams }: AdminQAPageProps) {
  const { eventSlug, adminCode } = await params;
  const { sort, status } = await searchParams;

  // Validate admin code and get event (this is sufficient for admin access)
  const event = await validateAdminCode(eventSlug, adminCode);

  const sortBy = sort === "new" ? "new" : "trending";
  const statusFilter = status === "answered" ? "answered" : status === "hidden" ? "hidden" : status === "pinned" ? "pinned" : status === "open" ? "open" : "all";

  // Get all questions (including hidden ones for admin) - using service client to bypass RLS
  const allQuestions = await getQuestionsForAdmin(event.id, sortBy, true);
  
  // Filter by status if needed
  let questions = allQuestions;
  if (statusFilter !== "all") {
    questions = allQuestions.filter((q) => q.status === statusFilter);
  }

  return (
    <AdminQAClient
      event={event}
      initialQuestions={questions}
      eventSlug={eventSlug}
      adminCode={adminCode}
      userId={undefined}
      sortBy={sortBy}
      statusFilter={statusFilter}
    />
  );
}
