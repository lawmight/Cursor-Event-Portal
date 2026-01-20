import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getQuestionsForAdmin } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { createClient } from "@/lib/supabase/server";
import { AdminQAClient } from "./AdminQAClient";

interface AdminQAPageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ sort?: string; status?: string }>;
}

export default async function AdminQAPage({ params, searchParams }: AdminQAPageProps) {
  const { eventSlug } = await params;
  const { sort, status } = await searchParams;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
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

  // Redirect to new admin URL format with adminCode
  if (event.admin_code) {
    const searchParamsStr = new URLSearchParams({ sort: sort || "trending", status: status || "all" }).toString();
    redirect(`/admin/${eventSlug}/${event.admin_code}/qa?${searchParamsStr}`);
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
      adminCode={undefined}
      userId={session.userId}
      sortBy={sortBy}
      statusFilter={statusFilter}
    />
  );
}

