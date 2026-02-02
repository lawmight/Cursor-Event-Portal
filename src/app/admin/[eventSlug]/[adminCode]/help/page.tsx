import { redirect } from "next/navigation";
import { getEventBySlug } from "@/lib/supabase/queries";

interface AdminHelpPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function AdminHelpPage({ params }: AdminHelpPageProps) {
  const { eventSlug, adminCode } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event || event.admin_code !== adminCode) {
    redirect(`/${eventSlug}`);
  }
  redirect(`/admin/${eventSlug}/${adminCode}/social?tab=help`);
}
