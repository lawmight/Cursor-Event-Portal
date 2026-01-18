"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RegistrationFormData } from "@/types";

export async function registerForEvent(
  eventId: string,
  eventSlug: string,
  formData: RegistrationFormData
) {
  const supabase = await createServiceClient();

  // Create or get user
  let userId: string;

  if (formData.email) {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", formData.email)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      // Update name if provided
      await supabase
        .from("users")
        .update({ name: formData.name })
        .eq("id", userId);
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          name: formData.name,
          email: formData.email,
          role: "attendee",
        })
        .select("id")
        .single();

      if (userError || !newUser) {
        return { error: "Failed to create user" };
      }
      userId = newUser.id;
    }
  } else {
    // Create anonymous user (no email)
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        name: formData.name,
        role: "attendee",
      })
      .select("id")
      .single();

    if (userError || !newUser) {
      return { error: "Failed to create user" };
    }
    userId = newUser.id;
  }

  // Check if already registered
  const { data: existingReg } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (existingReg) {
    // Already registered, set session and redirect
    await setSession(userId, eventId);
    return { success: true, alreadyRegistered: true };
  }

  // Create registration
  const { error: regError } = await supabase.from("registrations").insert({
    event_id: eventId,
    user_id: userId,
    consent_at: formData.consent ? new Date().toISOString() : null,
    source: "qr",
  });

  if (regError) {
    return { error: "Failed to register" };
  }

  // Set session cookie
  await setSession(userId, eventId);

  return { success: true };
}

async function setSession(userId: string, eventId: string) {
  const cookieStore = await cookies();

  // Create a simple session token
  const sessionData = {
    userId,
    eventId,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  cookieStore.set("portal_session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("portal_session");

  if (!session) return null;

  try {
    const data = JSON.parse(session.value);
    if (data.exp < Date.now()) {
      return null;
    }
    return data as { userId: string; eventId: string; exp: number };
  } catch {
    return null;
  }
}

export async function checkIn(registrationId: string) {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("registrations")
    .update({ checked_in_at: new Date().toISOString() })
    .eq("id", registrationId);

  if (error) {
    return { error: "Failed to check in" };
  }

  return { success: true };
}

export async function undoCheckIn(registrationId: string, eventSlug?: string) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("registrations")
    .update({ checked_in_at: null })
    .eq("id", registrationId)
    .select("user_id, event_id");

  if (error) {
    console.error("Undo check-in error:", error);
    return { error: error.message || "Failed to undo check-in" };
  }

  const registration = data?.[0];
  if (registration) {
    await cleanupAttendeeData(supabase, registration.event_id, registration.user_id);
  }

  // Revalidate the check-in page if eventSlug is provided
  if (eventSlug) {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/staff/${eventSlug}/checkin`);
  }

  console.log("Successfully undid check-in for registration:", registrationId);
  return { success: true };
}

export async function deregister(registrationId: string, eventSlug?: string) {
  const supabase = await createServiceClient();

  // Get the registration first to find the user_id
  const { data: registration, error: fetchError } = await supabase
    .from("registrations")
    .select("user_id, event_id")
    .eq("id", registrationId)
    .single();

  if (fetchError || !registration) {
    console.error("Deregister fetch error:", fetchError);
    return { error: "Registration not found" };
  }

  // Delete the registration
  const { error: deleteError } = await supabase
    .from("registrations")
    .delete()
    .eq("id", registrationId);

  if (deleteError) {
    console.error("Deregister delete error:", deleteError);
    return { error: deleteError.message || "Failed to deregister" };
  }

  await cleanupAttendeeData(supabase, registration.event_id, registration.user_id);

  // Check if user has any other registrations
  const { data: otherRegs, error: otherRegsError } = await supabase
    .from("registrations")
    .select("id")
    .eq("user_id", registration.user_id)
    .limit(1);

  // If user has no other registrations and is not an admin, optionally delete them
  // For now, we'll keep the user record but remove the registration

  // Revalidate the check-in page if eventSlug is provided
  if (eventSlug) {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/staff/${eventSlug}/checkin`);
  }

  console.log("Successfully deregistered registration:", registrationId);
  return { success: true };
}

async function cleanupAttendeeData(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  eventId: string,
  userId: string
) {
  await supabase
    .from("attendee_intakes")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  const { data: groupIds } = await supabase
    .from("suggested_groups")
    .select("id")
    .eq("event_id", eventId);

  const ids = (groupIds || []).map((group) => group.id);
  if (ids.length > 0) {
    await supabase
      .from("suggested_group_members")
      .delete()
      .eq("user_id", userId)
      .in("group_id", ids);

    const { data: remainingMembers } = await supabase
      .from("suggested_group_members")
      .select("group_id")
      .in("group_id", ids);

    const remainingGroupIds = new Set((remainingMembers || []).map((m) => m.group_id));
    const emptyGroupIds = ids.filter((id) => !remainingGroupIds.has(id));

    if (emptyGroupIds.length > 0) {
      await supabase.from("suggested_groups").delete().in("id", emptyGroupIds);
    }
  }
}

export async function addRegistrationByEmail(
  eventId: string,
  eventSlug: string,
  email: string
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated" };
  }

  const supabase = await createServiceClient();

  const { data: staffUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!staffUser || !["staff", "admin"].includes(staffUser.role)) {
    return { error: "Not authorized" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Please enter a valid email address" };
  }

  let userId: string;
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, name")
    .eq("email", normalizedEmail)
    .single();

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const fallbackName = normalizedEmail.split("@")[0] || "Attendee";
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        name: fallbackName,
        email: normalizedEmail,
        role: "attendee",
      })
      .select("id")
      .single();

    if (userError || !newUser) {
      return { error: "Failed to create user" };
    }
    userId = newUser.id;
  }

  const { data: existingReg } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (!existingReg) {
    const { error: regError } = await supabase.from("registrations").insert({
      event_id: eventId,
      user_id: userId,
      source: "walk-in",
    });

    if (regError) {
      return { error: "Failed to add registration" };
    }
  }

  const { data: registration, error: fetchError } = await supabase
    .from("registrations")
    .select("*, user:users(*, intakes:attendee_intakes(*))")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !registration) {
    return { error: "Failed to load new registration" };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/staff/${eventSlug}/checkin`);

  return { success: true, registration };
}
