import { notFound, redirect } from "next/navigation";
import { getQuestionsForAdmin } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { AdminQAClient } from "../../../[eventSlug]/qa/AdminQAClient";
import { validateAdminCode } from "@/lib/utils/admin";

interface AdminQAPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
  searchParams: Promise<{ sort?: string; status?: string }>;
}

export default async function AdminQAPage({ params, searchParams }: AdminQAPageProps) {
  const { eventSlug, adminCode } = await params;
  const { sort, status } = await searchParams;

  // Validate admin code and get event
  const event = await validateAdminCode(eventSlug, adminCode);

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
      userId={session.userId}
      sortBy={sortBy}
      statusFilter={statusFilter}
    />
  );
}
