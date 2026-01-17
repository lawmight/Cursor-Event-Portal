import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black-gradient flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Depth Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md z-10 text-center space-y-12 floating">
        <div className="space-y-6">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-3xl items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-4">
            <span className="text-4xl font-bold text-white tracking-tighter">C</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-light text-white tracking-tight text-shadow-glow">
              Cursor Portal
            </h1>
            <p className="text-gray-500 text-sm font-light tracking-widest uppercase opacity-50">
              Community Event Systems
            </p>
          </div>
        </div>

        <div className="glass rounded-[40px] p-8 space-y-4 border-white/[0.05] animate-slide-up">
          <Link
            href="/calgary-jan-2026"
            className="block w-full h-16 rounded-[24px] bg-white text-black flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]"
          >
            Calgary Meetup
          </Link>
          <p className="text-[10px] text-gray-700 uppercase tracking-[0.3em] font-light pt-4">
            Authorized Access Only
          </p>
        </div>
      </div>
    </main>
  );
}
