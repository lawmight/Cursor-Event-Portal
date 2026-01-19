-- Script to clear all slides from the database
-- Run this migration to delete all existing slides

DELETE FROM slides;

-- Optional: Also clean up the storage bucket
-- Note: This requires manual cleanup in Supabase Storage dashboard
-- or use the Supabase Storage API
