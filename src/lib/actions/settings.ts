"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/actions/registration";
import { revalidatePath } from "next/cache";

export async function setActiveEventSlug(slug: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in" };

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!user || user.role !== "admin") return { error: "Admin only" };

  const service = await createServiceClient();
  const { error } = await service
    .from("app_settings")
    .upsert({ key: "active_event_slug", value: slug, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}
