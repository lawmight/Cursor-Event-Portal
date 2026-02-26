import { redirect } from "next/navigation";
import { getActiveEventAdminCode } from "@/lib/supabase/queries";

export const revalidate = 0;

export default async function AdminCheckinRedirectPage() {
  const adminCode = await getActiveEventAdminCode();
  if (!adminCode) redirect("/admin/login");
  redirect(`/admin/${adminCode}/checkin`);
}
