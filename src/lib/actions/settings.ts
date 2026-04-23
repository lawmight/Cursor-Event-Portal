"use server";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EventStatus } from "@/types";
import { MOCK_EVENT } from "@/lib/mock/data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

async function assertEventAdmin(eventId: string, adminCode: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient();
  const { data: event } = await supabase
    .from("events")
    .select("admin_code")
    .eq("id", eventId)
    .maybeSingle();
  if (!event?.admin_code || event.admin_code !== adminCode) {
    return { error: "Unauthorized" };
  }
  return {};
}

/** Site-wide admin: may change which event is "live" for the whole portal (any slug). */
async function assertSiteWideAdmin(adminCodeFromUrl: string): Promise<{ error?: string }> {
  if (USE_MOCK) {
    if (adminCodeFromUrl !== MOCK_EVENT.admin_code) {
      return { error: "Unauthorized" };
    }
    return {};
  }

  const supabase = await createServiceClient();
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("portal_session");
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie.value) as { userId?: string; exp?: number };
      if (session.userId && (!session.exp || session.exp > Date.now())) {
        const { data: user } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.userId)
          .maybeSingle();
        if (user?.role === "admin") return {};
      }
    }
  } catch {
    /* fall through */
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    try {
      const cookieStore = await cookies();
      const ssr = createServerClient(url, anon, {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (_: { name: string; value: string; options?: CookieOptions }[]) => {},
        },
      });
      const { data: { user } } = await ssr.auth.getUser();
      if (user?.email) {
        const email = user.email.toLowerCase();
        const [allow, row] = await Promise.all([
          supabase.from("admin_emails").select("email").eq("email", email).maybeSingle(),
          supabase.from("users").select("role").eq("email", email).maybeSingle(),
        ]);
        if (allow.data || row.data?.role === "admin") return {};
      }
    } catch {
      /* fall through */
    }
  }

  return { error: "Unauthorized" };
}

export async function setActiveEventSlug(
  slug: string,
  adminCodeFromUrl: string
): Promise<{ error?: string }> {
  const auth = await assertSiteWideAdmin(adminCodeFromUrl);
  if (auth.error) return auth;

  const slugTrim = slug.trim();
  const service = await createServiceClient();
  if (USE_MOCK) {
    if (slugTrim !== MOCK_EVENT.slug) {
      return { error: "Event not found" };
    }
  } else {
    const { data: exists } = await service.from("events").select("id").eq("slug", slugTrim).maybeSingle();
    if (!exists) return { error: "Event not found" };
  }

  const { error } = await service
    .from("app_settings")
    .upsert({ key: "active_event_slug", value: slugTrim, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  return {};
}

export async function setEventStatus(
  eventId: string,
  status: EventStatus,
  adminCode: string
): Promise<{ error?: string }> {
  const auth = await assertEventAdmin(eventId, adminCode);
  if (auth.error) return auth;

  const service = await createServiceClient();
  const { error } = await service
    .from("events")
    .update({ status })
    .eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return {};
}
