import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cursor-purple text-white text-2xl font-bold mb-4">
            C
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Cursor Pop-Up Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Event management for Cursor community meetups
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/calgary-jan-2026?code=530"
            className="block w-full py-3 px-4 bg-cursor-purple hover:bg-cursor-purple-dark text-white font-medium rounded-lg transition-colors"
          >
            Calgary Meetup - Jan 28, 2026
          </Link>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
              For organizers:
            </p>
            <Link
              href="/admin/calgary-jan-2026"
              className="text-sm text-cursor-purple hover:text-cursor-purple-dark font-medium"
            >
              Admin Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
