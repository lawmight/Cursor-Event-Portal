"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

interface PreEventIntakeAccessProps {
  eventId: string;
  eventSlug: string;
}

export function PreEventIntakeAccess({ eventId, eventSlug }: PreEventIntakeAccessProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pre-event-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify registration");
        setIsLoading(false);
        return;
      }

      // Redirect to intake form
      router.push(`/${eventSlug}/intake`);
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-[32px] p-6 border-white/10 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-white/60" />
        </div>
        <div>
          <h3 className="text-lg font-light text-white tracking-tight">
            Complete Intake Pre-Event
          </h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">
            Help us make better connections
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="Enter your registered email"
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-hidden focus:border-white/20 transition-all text-sm"
        />

        {error && (
          <p className="text-[10px] text-red-400/80 uppercase tracking-widest">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full py-3 rounded-xl bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] uppercase tracking-[0.2em] font-bold"
        >
          {isLoading ? "Verifying..." : "Access Intake Form"}
        </button>
      </form>

      <p className="text-[9px] text-gray-600 text-center leading-relaxed pt-2">
        Share your goals and offers to help us facilitate better connections. This is optional and can be completed anytime before the event.
      </p>
    </div>
  );
}

