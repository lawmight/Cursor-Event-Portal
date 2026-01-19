import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-8">
        <h1 className="text-2xl font-light text-white">Admin Access</h1>
        <Link
          href="/admin/calgary-jan-2026/admin2026"
          className="inline-block px-8 py-4 bg-white text-black rounded-2xl font-medium hover:bg-gray-200 transition-all"
        >
          Enter Admin Dashboard
        </Link>
      </div>
    </main>
  );
}
