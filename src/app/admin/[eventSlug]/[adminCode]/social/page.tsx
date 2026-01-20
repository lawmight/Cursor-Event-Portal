import { EventSocialClient } from "./EventSocialClient";

interface EventSocialPageProps {
  params: Promise<{ eventSlug: string; adminCode: string }>;
}

export default async function EventSocialPage({ params }: EventSocialPageProps) {
  const { eventSlug, adminCode } = await params;

  return <EventSocialClient eventSlug={eventSlug} adminCode={adminCode} />;
}
