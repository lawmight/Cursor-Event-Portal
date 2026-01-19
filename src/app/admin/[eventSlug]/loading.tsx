import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-black-gradient text-white flex flex-col relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Header Skeleton */}
      <header className="z-10 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-6 mb-12">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-3 w-32 opacity-50" />
            </div>
          </div>

          {/* Quick Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-3xl p-6 border-white/20 space-y-4">
                <Skeleton className="w-5 h-5 opacity-30" />
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-3 w-20 opacity-30" />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="max-w-4xl mx-auto px-6 py-8 pb-16 w-full space-y-8 z-10 flex-1">
        <div className="glass rounded-[40px] p-10 border-white/20 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 opacity-30" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-10 w-16 opacity-30" />
          </div>
          <Skeleton className="h-[2px] w-full opacity-20" />
          <div className="flex gap-8">
            <Skeleton className="h-3 w-20 opacity-30" />
            <Skeleton className="h-3 w-20 opacity-30" />
            <Skeleton className="h-3 w-32 opacity-30" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass rounded-[40px] p-8 border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Skeleton className="w-14 h-14 rounded-2xl opacity-20" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-24 opacity-30" />
                </div>
              </div>
              <Skeleton className="w-5 h-5 opacity-20" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
