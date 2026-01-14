"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { registerForEvent } from "@/lib/actions/registration";

interface RegistrationFormProps {
  eventId: string;
  eventSlug: string;
}

export function RegistrationForm({ eventId, eventSlug }: RegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    consent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formData.consent) {
      setError("Please agree to the privacy policy");
      return;
    }

    setLoading(true);

    try {
      const result = await registerForEvent(eventId, eventSlug, {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        consent: formData.consent,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/${eventSlug}/agenda`);
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="Your name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email <span className="text-gray-400">(optional)</span>
        </label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          For event updates and post-event resources
        </p>
      </div>

      <div className="pt-2">
        <Checkbox
          checked={formData.consent}
          onChange={(e) =>
            setFormData({ ...formData, consent: e.target.checked })
          }
          label="I agree to the collection and use of my information as described in the privacy policy. I understand my data will be used for event management purposes."
          disabled={loading}
        />
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={loading}
      >
        Register for Event
      </Button>
    </form>
  );
}
