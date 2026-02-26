import { redirect } from "next/navigation";

export default async function AdminHelpPage({ params }: { params: Promise<{ adminCode: string }> }) {
  const { adminCode } = await params;
  redirect(`/admin/${adminCode}/social?tab=help`);
}
