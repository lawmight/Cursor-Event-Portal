/**
 * Script to clear all slides from the database
 * Run with: npx tsx scripts/clear-slides.ts
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function clearSlides() {
  console.log("Starting to clear slides from database...");

  try {
    // Get all slides first to get their storage paths
    const { data: slides, error: fetchError } = await supabase
      .from("slides")
      .select("id, image_url, event_id");

    if (fetchError) {
      console.error("Error fetching slides:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${slides?.length || 0} slides to delete`);

    // Delete all slides from database
    const { error: deleteError } = await supabase.from("slides").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      console.error("Error deleting slides:", deleteError);
      throw deleteError;
    }

    console.log("✅ Successfully cleared all slides from database");

    // Optionally clean up storage files
    if (slides && slides.length > 0) {
      console.log("\nNote: Slide images are still in storage.");
      console.log("To clean up storage files, you can manually delete them from the 'slides' bucket in Supabase Storage.");
    }

    return { success: true, deletedCount: slides?.length || 0 };
  } catch (error) {
    console.error("Failed to clear slides:", error);
    throw error;
  }
}

// Run the script
clearSlides()
  .then((result) => {
    console.log("\n✅ Script completed successfully");
    console.log(`Deleted ${result.deletedCount} slides`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
