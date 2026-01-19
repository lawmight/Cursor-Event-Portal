import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  // Bypass login - redirect directly to admin dashboard
  redirect("/admin/calgary-jan-2026/admin2026");
}
