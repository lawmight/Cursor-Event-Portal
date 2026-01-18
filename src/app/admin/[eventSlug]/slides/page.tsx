import { notFound, redirect } from "next/navigation";
import { getEventBySlug } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { getSlides } from "@/lib/actions/slides";
import { createClient } from "@/lib/supabase/server";
import { SlidesAdminClient } from "./SlidesAdminClient";

interface AdminSlidesPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function AdminSlidesPage({ params }: AdminSlidesPageProps) {
  const { eventSlug } = await params;

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

  const slides = await getSlides(event.id);

  return <SlidesAdminClient event={event} eventSlug={eventSlug} initialSlides={slides} />;
}

