/**
 * Script to remove speaker from Build Session agenda item
 * 
 * This removes "Jia Ming Huang" from the Build Session since it's a group activity
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EVENT_SLUG = "calgary-jan-2026";

async function removeBuildSessionSpeaker() {
  // Get event ID
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("slug", EVENT_SLUG)
    .single();

  if (eventError || !event) {
    console.error("Error finding event:", eventError);
    return;
  }

  console.log(`Found event: ${event.id}`);

  // Find the Build Session agenda item
  const { data: buildSession, error: findError } = await supabase
    .from("agenda_items")
    .select("id, title")
    .eq("event_id", event.id)
    .eq("title", "Build Session")
    .single();

  if (findError || !buildSession) {
    console.error("Error finding Build Session:", findError);
    return;
  }

  console.log(`Found Build Session: ${buildSession.id}`);

  // Update to remove speaker
  const { data: updated, error: updateError } = await supabase
    .from("agenda_items")
    .update({ speaker: null })
    .eq("id", buildSession.id)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating Build Session:", updateError);
    return;
  }

  console.log("Successfully removed speaker from Build Session!");
  console.log(`Updated item: ${updated.title} (speaker: ${updated.speaker || "none"})`);
}

removeBuildSessionSpeaker()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
  });
