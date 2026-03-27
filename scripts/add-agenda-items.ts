/**
 * Script to add agenda items for the original January 2026 meetup.
 *
 * Event: 5:30pm start, 8:30pm finish local time on Jan 28, 2026.
 *
 * Run this script to populate the agenda items for the event.
 * Make sure to set the EVENT_ID environment variable or update it in the script.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EVENT_SLUG = "shanghai-jan-2026";
const EVENT_DATE = "2026-01-28";

// All times are stored in UTC.

const agendaItems = [
  {
    title: "Arrivals and Mingle",
    description: "Connect with fellow developers. Collaboration pods available.",
    start_time: "2026-01-29T00:30:00Z", // 5:30pm MST
    end_time: "2026-01-29T01:00:00Z", // 6:00pm MST
    sort_order: 0,
  },
  {
    title: "Intro to Cursor",
    description: "Event introduction and welcome.",
    speaker: "Jia Ming Huang",
    start_time: "2026-01-29T01:00:00Z", // 6:00pm MST
    end_time: "2026-01-29T01:10:00Z", // 6:10pm MST
    sort_order: 1,
  },
  {
    title: "Community Demos",
    description: "Quick demos showcasing Cursor capabilities.",
    speaker: "Simon Loewen",
    start_time: "2026-01-29T01:10:00Z", // 6:10pm MST
    end_time: "2026-01-29T01:30:00Z", // 6:30pm MST
    sort_order: 2,
  },
  {
    title: "Building",
    description: "Collaborative building session. Work with your pod and get help from facilitators.",
    start_time: "2026-01-29T01:30:00Z", // 6:30pm MST
    end_time: "2026-01-29T02:30:00Z", // 7:30pm MST
    sort_order: 3,
  },
  {
    title: "Networking and Judging",
    description: "Network with other attendees while judges evaluate the builds.",
    start_time: "2026-01-29T02:30:00Z", // 7:30pm MST
    end_time: "2026-01-29T02:45:00Z", // 7:45pm MST
    sort_order: 4,
  },
  {
    title: "Build Showcase",
    description: "Quick demos from each pod followed by community voting. Prizes awarded to winners.",
    start_time: "2026-01-29T02:45:00Z", // 7:45pm MST
    end_time: "2026-01-29T03:00:00Z", // 8:00pm MST
    sort_order: 5,
  },
  {
    title: "Wind-Down",
    description: "Continue networking and share contact information.",
    start_time: "2026-01-29T03:00:00Z", // 8:00pm MST
    end_time: "2026-01-29T03:30:00Z", // 8:30pm MST (finish)
    sort_order: 6,
  },
];

async function addAgendaItems() {
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

  // Check if agenda items already exist
  const { data: existingItems } = await supabase
    .from("agenda_items")
    .select("id")
    .eq("event_id", event.id);

  if (existingItems && existingItems.length > 0) {
    console.log(`Found ${existingItems.length} existing agenda items. Skipping.`);
    console.log("To re-run, delete existing agenda items first.");
    return;
  }

  // Insert agenda items
  const itemsToInsert = agendaItems.map((item) => ({
    event_id: event.id,
    ...item,
  }));

  const { data, error } = await supabase
    .from("agenda_items")
    .insert(itemsToInsert)
    .select();

  if (error) {
    console.error("Error inserting agenda items:", error);
    return;
  }

  console.log(`Successfully added ${data.length} agenda items!`);
  data.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title} (${item.start_time} - ${item.end_time})`);
  });
}

addAgendaItems()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
  });

