import { Skeleton } from "@/components/ui/skeleton";

export default function AgendaLoading() {
  return (
    <div className="min-h-screen bg-black-gradient flex flex-col pb-40 relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Header Skeleton */}
      <header className="z-10 pt-12 pb-8 px-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32 opacity-50" />
            </div>
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full px-6 py-12 space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-3 w-20 opacity-30" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass rounded-[24px] p-6 border-white/5 bg-white/[0.02] space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16 opacity-30" />
              </div>
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-3 w-1/4 opacity-50" />
            </div>
          ))}
        </div>
      </main>

      {/* Nav Skeleton */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <Skeleton className="w-64 h-16 rounded-full" />
      </div>
    </div>
  );
}
