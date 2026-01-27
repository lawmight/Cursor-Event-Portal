"use client";

import { createClient } from "@/lib/supabase/client";

export type SeenItemType = 'question' | 'poll' | 'announcement' | 'table_assignment' | 'slide';
export type DismissalType = 'intake_banner' | 'survey_prompt' | 'poll_notification' | 'table_assignment_animation' | 'welcome_modal';

// ============================================================================
// CLIENT-SIDE READ FUNCTIONS (use Supabase client directly)
// ============================================================================

/**
 * Get all seen item IDs for a user, event, and item type
 */
export async function getSeenItemIds(
  userId: string,
  eventId: string,
  itemType: SeenItemType
): Promise<string[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("user_seen_items")
      .select("item_id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .eq("item_type", itemType);

    if (error) {
      console.error("[getSeenItemIds] Error:", error);
      return [];
    }

    return (data || []).map(row => row.item_id);
  } catch (error) {
    console.error("[getSeenItemIds] Exception:", error);
    return [];
  }
}

/**
 * Check if a specific item has been seen by a user
 */
export async function hasUserSeenItem(
  userId: string,
  itemType: SeenItemType,
  itemId: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("user_seen_items")
      .select("id")
      .eq("user_id", userId)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle();

    if (error) {
      console.error("[hasUserSeenItem] Error:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("[hasUserSeenItem] Exception:", error);
    return false;
  }
}

/**
 * Check if a dismissal has occurred
 */
export async function hasDismissed(
  userId: string,
  eventId: string,
  dismissalType: DismissalType
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("ui_dismissals")
      .select("id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .eq("dismissal_type", dismissalType)
      .maybeSingle();

    if (error) {
      console.error("[hasDismissed] Error:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("[hasDismissed] Exception:", error);
    return false;
  }
}

// ============================================================================
// CLIENT-SIDE WRITE FUNCTIONS (use Supabase client directly)
// ============================================================================

/**
 * Mark an item as seen
 */
export async function markItemAsSeen(
  userId: string,
  eventId: string,
  itemType: SeenItemType,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase.from("user_seen_items").upsert({
      user_id: userId,
      event_id: eventId,
      item_type: itemType,
      item_id: itemId,
    }, {
      onConflict: 'user_id,item_type,item_id',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error("[markItemAsSeen] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[markItemAsSeen] Exception:", error);
    return { success: false, error: "Failed to mark item as seen" };
  }
}

/**
 * Mark multiple items as seen
 */
export async function markMultipleItemsAsSeen(
  userId: string,
  eventId: string,
  itemType: SeenItemType,
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (itemIds.length === 0) {
      return { success: true };
    }

    const supabase = createClient();
    
    const records = itemIds.map(itemId => ({
      user_id: userId,
      event_id: eventId,
      item_type: itemType,
      item_id: itemId,
    }));

    const { error } = await supabase.from("user_seen_items").upsert(records, {
      onConflict: 'user_id,item_type,item_id',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error("[markMultipleItemsAsSeen] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[markMultipleItemsAsSeen] Exception:", error);
    return { success: false, error: "Failed to mark items as seen" };
  }
}

/**
 * Record a dismissal
 */
export async function recordDismissal(
  userId: string,
  eventId: string,
  dismissalType: DismissalType
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase.from("ui_dismissals").upsert({
      user_id: userId,
      event_id: eventId,
      dismissal_type: dismissalType,
    }, {
      onConflict: 'user_id,event_id,dismissal_type',
      ignoreDuplicates: true,
    });

    if (error) {
      console.error("[recordDismissal] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[recordDismissal] Exception:", error);
    return { success: false, error: "Failed to record dismissal" };
  }
}
