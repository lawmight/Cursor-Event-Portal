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

export async function undoCheckIn(registrationId: string) {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("registrations")
    .update({ checked_in_at: null })
    .eq("id", registrationId);

  if (error) {
    return { error: "Failed to undo check-in" };
  }

  return { success: true };
}
