-- Add media fields to competition_entries for GitHub + media flow
-- Preview image: screenshot or hero image shown on cards and big screen
-- Video URL: optional screen recording or demo video (YouTube, Vimeo, etc.)

ALTER TABLE competition_entries
  ADD COLUMN IF NOT EXISTS preview_image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN competition_entries.preview_image_url IS 'URL to screenshot/image for voting display and big-screen showcase';
COMMENT ON COLUMN competition_entries.video_url IS 'Optional demo video URL (e.g. YouTube, Vimeo)';
