/**
 * Script to add agenda items for Calgary Cursor Meetup - January 2026
 * 
 * Event: 2026-01-28 18:00:00+00 to 21:00:00+00 (6pm-9pm MST)
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

const EVENT_SLUG = "calgary-jan-2026";
const EVENT_DATE = "2026-01-28";

// All times in UTC (MST is UTC-7, so 6pm MST = 1am UTC next day)
// Actually, let's use local time and convert properly
// Event is 6pm-9pm MST on Jan 28, 2026
// MST is UTC-7, so 6pm MST = 1am UTC on Jan 29
// But let's use the event's timezone properly

// Times in ISO format (assuming event is in Calgary timezone, UTC-7)
// We'll use UTC times: 6pm MST = 1am UTC next day
const BASE_DATE = "2026-01-29T01:00:00Z"; // 6pm MST Jan 28 = 1am UTC Jan 29

const agendaItems = [
  {
    title: "Mingling & Networking",
    description: "Arrive early and connect with fellow developers. The room will be set up into pods for collaboration.",
    start_time: "2026-01-29T00:30:00Z", // 5:30pm MST
    end_time: "2026-01-29T01:00:00Z", // 6:00pm MST
    sort_order: 0,
  },
  {
    title: "Welcome & Introductions",
    description: "Quick 5-minute introduction to kick off the event.",
    speaker: "Jia Ming Huang",
    start_time: "2026-01-29T01:00:00Z", // 6:00pm MST
    end_time: "2026-01-29T01:05:00Z", // 6:05pm MST
    sort_order: 1,
  },
  {
    title: "Short Demos",
    description: "A few quick demos (2-3 minutes each) showcasing what's possible with Cursor.",
    speaker: "Jia Ming Huang",
    start_time: "2026-01-29T01:05:00Z", // 6:05pm MST
    end_time: "2026-01-29T01:20:00Z", // 6:20pm MST
    sort_order: 2,
  },
  {
    title: "Build Session",
    description: "Work with your pod to build something together. Walk around to get help and answer questions. Room is set up in collaboration pods.",
    speaker: "Jia Ming Huang",
    start_time: "2026-01-29T01:20:00Z", // 6:20pm MST
    end_time: "2026-01-29T02:20:00Z", // 7:20pm MST
    sort_order: 3,
  },
  {
    title: "Blitz Demos & Community Voting",
    description: "Quick demos from each pod followed by community voting. Prizes will be awarded based on community votes (pending merch/swag confirmation).",
    start_time: "2026-01-29T02:20:00Z", // 7:20pm MST
    end_time: "2026-01-29T03:00:00Z", // 8:00pm MST
    sort_order: 4,
  },
  {
    title: "Networking & Tear-Down",
    description: "Continue networking, share contact information, and help clean up.",
    start_time: "2026-01-29T03:00:00Z", // 8:00pm MST
    end_time: "2026-01-29T04:00:00Z", // 9:00pm MST
    sort_order: 5,
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
