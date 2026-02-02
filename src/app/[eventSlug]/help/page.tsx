import { redirect } from "next/navigation";

interface HelpPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { eventSlug } = await params;
  redirect(`/${eventSlug}/socials/help`);
}
