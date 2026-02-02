import { redirect } from "next/navigation";

interface SocialsPageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export default async function SocialsPage({ params, searchParams }: SocialsPageProps) {
  const { eventSlug } = await params;
  const { sort } = await searchParams;
  const qs = sort ? `?sort=${sort}` : "";
  redirect(`/${eventSlug}/socials/qa${qs}`);
}
