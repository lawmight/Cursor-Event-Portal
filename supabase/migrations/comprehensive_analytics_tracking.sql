-- ============================================================================
-- COMPREHENSIVE ANALYTICS & DATA TRACKING MIGRATION
-- ============================================================================
-- This migration adds robust analytics tracking to ensure ALL user data,
-- interactions, and metrics are stored in Supabase - nothing cached locally.
-- ============================================================================

-- ============================================================================
-- 1. PAGE VIEWS & SESSION TRACKING
-- ============================================================================
-- Track every page view with context

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
  session_id TEXT, -- Browser session identifier
  page_path TEXT NOT NULL, -- e.g., '/calgary-jan-2026/agenda'
  page_type TEXT NOT NULL CHECK (page_type IN (
    'landing', 'registration', 'intake', 'agenda', 'qa', 'polls', 
    'slides', 'resources', 'feedback', 'display', 'admin', 'staff'
  )),
  referrer TEXT, -- Where they came from
  user_agent TEXT, -- Browser info
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  duration_ms INTEGER, -- Time spent on page (updated on leave)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_event_id ON page_views(event_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_type ON page_views(page_type);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

-- ============================================================================
-- 2. USER SESSIONS (REPLACE CLIENT-SIDE SESSION TRACKING)
-- ============================================================================
-- Track user sessions with proper server-side storage

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE, -- Secure token for cookie
  device_info JSONB, -- {userAgent, platform, etc.}
  ip_hash TEXT, -- Hashed IP for security
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ, -- NULL if still active
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_event_id ON user_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, event_id) WHERE ended_at IS NULL;

-- ============================================================================
-- 3. FEATURE INTERACTIONS (REPLACE localStorage TRACKING)
-- ============================================================================
-- Track when users interact with specific features

CREATE TABLE IF NOT EXISTS feature_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN (
    'question_viewed', 'question_created', 'question_upvoted',
    'poll_viewed', 'poll_voted',
    'slide_viewed', 'slide_deck_opened',
    'survey_started', 'survey_completed',
    'intake_started', 'intake_completed', 'intake_skipped',
    'check_in_completed', 'table_assignment_viewed',
    'announcement_seen', 'banner_dismissed',
    'resource_accessed'
  )),
  target_id UUID, -- ID of the question/poll/slide/etc.
  metadata JSONB, -- Additional context (e.g., {poll_option: 2, duration_ms: 5000})
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_interactions_event_id ON feature_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_feature_interactions_user_id ON feature_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_interactions_feature_type ON feature_interactions(feature_type);
CREATE INDEX IF NOT EXISTS idx_feature_interactions_target_id ON feature_interactions(target_id);
CREATE INDEX IF NOT EXISTS idx_feature_interactions_created_at ON feature_interactions(created_at);

-- Composite index for checking if user has seen something
CREATE INDEX IF NOT EXISTS idx_feature_interactions_user_target 
  ON feature_interactions(user_id, feature_type, target_id);

-- ============================================================================
-- 4. QUESTION VIEW COUNTS
-- ============================================================================
-- Track question views (not just upvotes)

CREATE TABLE IF NOT EXISTS question_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous tracking
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_views_question_id ON question_views(question_id);
CREATE INDEX IF NOT EXISTS idx_question_views_user_id ON question_views(user_id);

-- Add view count to questions table (cached for performance)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Function to update view count
CREATE OR REPLACE FUNCTION update_question_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE questions SET view_count = view_count + 1 WHERE id = NEW.question_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_view_count ON question_views;
CREATE TRIGGER trigger_update_question_view_count
  AFTER INSERT ON question_views
  FOR EACH ROW EXECUTE FUNCTION update_question_view_count();

-- ============================================================================
-- 5. POLL VIEWS (Track views separate from votes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS poll_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poll_views_poll_id ON poll_views(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_views_user_id ON poll_views(user_id);

-- Add view count to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Function to update poll view count
CREATE OR REPLACE FUNCTION update_poll_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE polls SET view_count = view_count + 1 WHERE id = NEW.poll_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_poll_view_count ON poll_views;
CREATE TRIGGER trigger_update_poll_view_count
  AFTER INSERT ON poll_views
  FOR EACH ROW EXECUTE FUNCTION update_poll_view_count();

-- ============================================================================
-- 6. SLIDE ENGAGEMENT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS slide_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  slide_id UUID REFERENCES slides(id) ON DELETE SET NULL, -- For individual slides
  slide_deck_id UUID REFERENCES slide_decks(id) ON DELETE SET NULL, -- For PDF decks
  page_number INTEGER, -- Which page/slide number
  duration_ms INTEGER, -- Time spent on this slide
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slide_views_event_id ON slide_views(event_id);
CREATE INDEX IF NOT EXISTS idx_slide_views_user_id ON slide_views(user_id);
CREATE INDEX IF NOT EXISTS idx_slide_views_slide_id ON slide_views(slide_id);
CREATE INDEX IF NOT EXISTS idx_slide_views_slide_deck_id ON slide_views(slide_deck_id);

-- ============================================================================
-- 7. ADMIN ACTIONS AUDIT LOG
-- ============================================================================
-- Track all admin/staff actions for accountability

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'event_created', 'event_updated', 'event_status_changed',
    'registration_added', 'registration_removed', 'check_in_manual',
    'question_status_changed', 'question_deleted', 'answer_created',
    'poll_created', 'poll_updated', 'poll_deleted', 'poll_activated',
    'announcement_created', 'announcement_deleted',
    'survey_created', 'survey_published', 'survey_unpublished',
    'group_approved', 'group_rejected', 'group_modified',
    'slide_uploaded', 'slide_deleted', 'slide_deck_uploaded',
    'lockout_enabled', 'lockout_disabled',
    'data_exported', 'data_deleted'
  )),
  target_type TEXT, -- 'user', 'question', 'poll', etc.
  target_id UUID,
  previous_value JSONB, -- State before change
  new_value JSONB, -- State after change
  metadata JSONB, -- Additional context
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_event_id ON admin_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);

-- ============================================================================
-- 8. SEEN ITEMS TRACKING (REPLACE localStorage)
-- ============================================================================
-- Track which items users have seen (replaces localStorage-based tracking)

CREATE TABLE IF NOT EXISTS user_seen_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'question', 'poll', 'announcement', 'table_assignment', 'slide'
  )),
  item_id UUID NOT NULL, -- ID of the question/poll/announcement/etc.
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_seen_items_user_id ON user_seen_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_seen_items_event_id ON user_seen_items(event_id);
CREATE INDEX IF NOT EXISTS idx_user_seen_items_lookup ON user_seen_items(user_id, item_type);

-- ============================================================================
-- 9. ERROR TRACKING
-- ============================================================================
-- Track client-side errors for debugging

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  error_type TEXT NOT NULL, -- 'javascript', 'api', 'validation', etc.
  error_message TEXT NOT NULL,
  error_stack TEXT,
  page_path TEXT,
  user_agent TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_event_id ON error_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- ============================================================================
-- 10. REAL-TIME ANALYTICS AGGREGATES
-- ============================================================================
-- Pre-computed metrics for dashboard performance

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN (
    'hourly', 'daily', 'event_final'
  )),
  metrics JSONB NOT NULL, -- {registered: 50, checked_in: 45, questions: 12, ...}
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_event_id ON analytics_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_type ON analytics_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_period ON analytics_snapshots(period_start, period_end);

-- ============================================================================
-- 11. NOTIFICATION PREFERENCES (for future use)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email_announcements BOOLEAN NOT NULL DEFAULT true,
  email_table_assignments BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ============================================================================
-- 12. BANNER DISMISSALS (REPLACE localStorage)
-- ============================================================================
-- Track banner/modal dismissals (replaces localStorage)

CREATE TABLE IF NOT EXISTS ui_dismissals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  dismissal_type TEXT NOT NULL CHECK (dismissal_type IN (
    'intake_banner', 'survey_prompt', 'poll_notification', 
    'table_assignment_animation', 'welcome_modal'
  )),
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id, dismissal_type)
);

CREATE INDEX IF NOT EXISTS idx_ui_dismissals_user_id ON ui_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_ui_dismissals_lookup ON ui_dismissals(user_id, event_id, dismissal_type);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE slide_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_seen_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_dismissals ENABLE ROW LEVEL SECURITY;

-- Page views policies
CREATE POLICY "Page views are viewable by everyone" ON page_views FOR SELECT USING (true);
CREATE POLICY "Page views can be inserted by service role" ON page_views FOR INSERT WITH CHECK (true);

-- User sessions policies
CREATE POLICY "User sessions are viewable by everyone" ON user_sessions FOR SELECT USING (true);
CREATE POLICY "User sessions can be inserted by service role" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "User sessions can be updated by service role" ON user_sessions FOR UPDATE USING (true);

-- Feature interactions policies
CREATE POLICY "Feature interactions are viewable by everyone" ON feature_interactions FOR SELECT USING (true);
CREATE POLICY "Feature interactions can be inserted by service role" ON feature_interactions FOR INSERT WITH CHECK (true);

-- Question views policies
CREATE POLICY "Question views are viewable by everyone" ON question_views FOR SELECT USING (true);
CREATE POLICY "Question views can be inserted by service role" ON question_views FOR INSERT WITH CHECK (true);

-- Poll views policies
CREATE POLICY "Poll views are viewable by everyone" ON poll_views FOR SELECT USING (true);
CREATE POLICY "Poll views can be inserted by service role" ON poll_views FOR INSERT WITH CHECK (true);

-- Slide views policies
CREATE POLICY "Slide views are viewable by everyone" ON slide_views FOR SELECT USING (true);
CREATE POLICY "Slide views can be inserted by service role" ON slide_views FOR INSERT WITH CHECK (true);

-- Admin audit log policies
CREATE POLICY "Admin audit log is viewable by everyone" ON admin_audit_log FOR SELECT USING (true);
CREATE POLICY "Admin audit log can be inserted by service role" ON admin_audit_log FOR INSERT WITH CHECK (true);

-- User seen items policies
CREATE POLICY "User seen items are viewable by everyone" ON user_seen_items FOR SELECT USING (true);
CREATE POLICY "User seen items can be inserted by service role" ON user_seen_items FOR INSERT WITH CHECK (true);

-- Error logs policies
CREATE POLICY "Error logs are viewable by everyone" ON error_logs FOR SELECT USING (true);
CREATE POLICY "Error logs can be inserted by service role" ON error_logs FOR INSERT WITH CHECK (true);

-- Analytics snapshots policies
CREATE POLICY "Analytics snapshots are viewable by everyone" ON analytics_snapshots FOR SELECT USING (true);
CREATE POLICY "Analytics snapshots can be inserted by service role" ON analytics_snapshots FOR INSERT WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Notification preferences are viewable by everyone" ON notification_preferences FOR SELECT USING (true);
CREATE POLICY "Notification preferences can be inserted by service role" ON notification_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Notification preferences can be updated by service role" ON notification_preferences FOR UPDATE USING (true);

-- UI dismissals policies
CREATE POLICY "UI dismissals are viewable by everyone" ON ui_dismissals FOR SELECT USING (true);
CREATE POLICY "UI dismissals can be inserted by service role" ON ui_dismissals FOR INSERT WITH CHECK (true);

-- ============================================================================
-- ENABLE REALTIME FOR KEY TABLES
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE page_views;
ALTER PUBLICATION supabase_realtime ADD TABLE feature_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_seen_items;
ALTER PUBLICATION supabase_realtime ADD TABLE analytics_snapshots;

-- ============================================================================
-- HELPFUL ANALYTICS VIEWS
-- ============================================================================

-- View: Event engagement summary
CREATE OR REPLACE VIEW event_engagement_summary AS
SELECT 
  e.id as event_id,
  e.slug as event_slug,
  e.name as event_name,
  COUNT(DISTINCT r.user_id) as total_registrations,
  COUNT(DISTINCT r.user_id) FILTER (WHERE r.checked_in_at IS NOT NULL) as checked_in,
  COUNT(DISTINCT ai.user_id) FILTER (WHERE ai.skipped = false) as intake_completed,
  COUNT(DISTINCT ai.user_id) FILTER (WHERE ai.skipped = true) as intake_skipped,
  COUNT(DISTINCT q.id) as total_questions,
  COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'answered') as answered_questions,
  SUM(q.upvotes) as total_upvotes,
  COUNT(DISTINCT p.id) as total_polls,
  COUNT(DISTINCT pv.user_id) as unique_poll_voters,
  COUNT(DISTINCT sr.user_id) as survey_respondents
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
LEFT JOIN attendee_intakes ai ON ai.event_id = e.id
LEFT JOIN questions q ON q.event_id = e.id
LEFT JOIN polls p ON p.event_id = e.id
LEFT JOIN poll_votes pv ON pv.poll_id = p.id
LEFT JOIN surveys s ON s.event_id = e.id
LEFT JOIN survey_responses sr ON sr.survey_id = s.id
GROUP BY e.id, e.slug, e.name;

-- View: User engagement for an event
CREATE OR REPLACE VIEW user_event_engagement AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  r.event_id,
  r.created_at as registered_at,
  r.checked_in_at,
  r.intake_completed_at,
  ai.goals,
  ai.offers,
  ai.skipped as intake_skipped,
  COUNT(DISTINCT q.id) as questions_asked,
  COUNT(DISTINCT ans.id) as answers_given,
  COUNT(DISTINCT qu.question_id) as questions_upvoted,
  COUNT(DISTINCT pv.poll_id) as polls_voted,
  COUNT(DISTINCT sr.id) as surveys_completed,
  sgm.group_id as assigned_group_id,
  sg.table_number as assigned_table
FROM users u
JOIN registrations r ON r.user_id = u.id
LEFT JOIN attendee_intakes ai ON ai.user_id = u.id AND ai.event_id = r.event_id
LEFT JOIN questions q ON q.user_id = u.id AND q.event_id = r.event_id
LEFT JOIN answers ans ON ans.user_id = u.id
LEFT JOIN question_upvotes qu ON qu.user_id = u.id
LEFT JOIN poll_votes pv ON pv.user_id = u.id
LEFT JOIN survey_responses sr ON sr.user_id = u.id
LEFT JOIN suggested_group_members sgm ON sgm.user_id = u.id
LEFT JOIN suggested_groups sg ON sg.id = sgm.group_id AND sg.event_id = r.event_id
GROUP BY u.id, u.name, u.email, r.event_id, r.created_at, r.checked_in_at, 
         r.intake_completed_at, ai.goals, ai.offers, ai.skipped, 
         sgm.group_id, sg.table_number;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to mark item as seen (replaces localStorage)
CREATE OR REPLACE FUNCTION mark_item_seen(
  p_user_id UUID,
  p_event_id UUID,
  p_item_type TEXT,
  p_item_id UUID
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_seen_items (user_id, event_id, item_type, item_id)
  VALUES (p_user_id, p_event_id, p_item_type, p_item_id)
  ON CONFLICT (user_id, item_type, item_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has seen item
CREATE OR REPLACE FUNCTION has_user_seen_item(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_seen_items 
    WHERE user_id = p_user_id 
      AND item_type = p_item_type 
      AND item_id = p_item_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get unseen items of a type for a user
CREATE OR REPLACE FUNCTION get_unseen_items(
  p_user_id UUID,
  p_event_id UUID,
  p_item_type TEXT
) RETURNS TABLE(item_id UUID) AS $$
BEGIN
  IF p_item_type = 'question' THEN
    RETURN QUERY
    SELECT q.id FROM questions q
    WHERE q.event_id = p_event_id
      AND q.status = 'open'
      AND NOT EXISTS (
        SELECT 1 FROM user_seen_items usi 
        WHERE usi.user_id = p_user_id 
          AND usi.item_type = 'question' 
          AND usi.item_id = q.id
      );
  ELSIF p_item_type = 'poll' THEN
    RETURN QUERY
    SELECT p.id FROM polls p
    WHERE p.event_id = p_event_id
      AND p.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM user_seen_items usi 
        WHERE usi.user_id = p_user_id 
          AND usi.item_type = 'poll' 
          AND usi.item_id = p.id
      );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_event_id UUID,
  p_admin_user_id UUID,
  p_action_type TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    event_id, admin_user_id, action_type, target_type, 
    target_id, previous_value, new_value, metadata
  )
  VALUES (
    p_event_id, p_admin_user_id, p_action_type, p_target_type,
    p_target_id, p_previous_value, p_new_value, p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record page view
CREATE OR REPLACE FUNCTION record_page_view(
  p_event_id UUID,
  p_user_id UUID,
  p_session_id TEXT,
  p_page_path TEXT,
  p_page_type TEXT,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_view_id UUID;
BEGIN
  INSERT INTO page_views (
    event_id, user_id, session_id, page_path, page_type,
    referrer, user_agent, device_type
  )
  VALUES (
    p_event_id, p_user_id, p_session_id, p_page_path, p_page_type,
    p_referrer, p_user_agent, p_device_type
  )
  RETURNING id INTO v_view_id;
  
  RETURN v_view_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record feature interaction
CREATE OR REPLACE FUNCTION record_feature_interaction(
  p_event_id UUID,
  p_user_id UUID,
  p_feature_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  INSERT INTO feature_interactions (
    event_id, user_id, feature_type, target_id, metadata
  )
  VALUES (
    p_event_id, p_user_id, p_feature_type, p_target_id, p_metadata
  )
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION mark_item_seen TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION has_user_seen_item TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_unseen_items TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION record_page_view TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION record_feature_interaction TO authenticated, anon, service_role;

-- ============================================================================
-- DONE!
-- ============================================================================
s