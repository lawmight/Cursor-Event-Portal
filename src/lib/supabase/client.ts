import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // In mock mode (NEXT_PUBLIC_USE_MOCK_DATA=true) the real data layer is
  // served by the webpack-aliased mock in src/lib/mock/queries.ts, and the
  // Supabase anon/service env vars are intentionally unset. Client-side
  // components that call createClient() to set up realtime channels are
  // best-effort — fall back to harmless placeholder URLs so the browser
  // client constructs successfully (no-op subscriptions) instead of
  // throwing during hydration.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
      ? "https://mock.invalid"
      : undefined);
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ? "mock-anon" : undefined);

  return createBrowserClient(url!, anonKey!);
}
