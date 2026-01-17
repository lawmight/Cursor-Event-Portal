"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, AlertCircle, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push(`/admin/${data.eventSlug}`);
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin();
    }
  };

  return (
    <main className="min-h-screen bg-black-gradient flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white/60" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-white">Admin Login</h1>
            <p className="text-gray-500 text-sm mt-2">Enter your admin email</p>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 space-y-6">
          <div className="relative group">
            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-white transition-colors" />
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-transparent border-b border-white/10 rounded-none pl-10 pr-4 h-14 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all text-lg font-light"
              autoFocus
              autoComplete="email"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400/80">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-light">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading || !email.trim()}
            className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="text-sm font-bold uppercase tracking-[0.2em]">
                Login
              </span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
