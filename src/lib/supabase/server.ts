import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy-based session refreshing.
          }
        },
      },
    }
  );
}

export async function createServiceClient() {
  // Use direct Supabase client for server actions to bypass RLS
  // This is more reliable than using createServerClient with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Please check your environment variables.");
  }

  if (!serviceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Please check your environment variables. This key is required for server actions.");
  }

  // Validate the key format (service role keys start with 'eyJ' for legacy JWT or 'sb_secret_' for new format)
  if (!serviceRoleKey.startsWith('eyJ') && !serviceRoleKey.startsWith('sb_secret_')) {
    console.error("Invalid SUPABASE_SERVICE_ROLE_KEY format");
    throw new Error("Invalid SUPABASE_SERVICE_ROLE_KEY format. Please verify the key is correct.");
  }

  try {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error("Failed to create Supabase service client:", error);
    throw new Error("Failed to initialize Supabase client. Please check your environment variables.");
  }
}
