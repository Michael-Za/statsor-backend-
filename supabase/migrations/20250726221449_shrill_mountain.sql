/*
  # Community Hub Database Schema

  1. New Tables
    - `verification_requests` - Player verification submissions
    - `match_threads` - Live match discussion threads
    - `thread_messages` - Messages in match threads
    - `skill_swaps` - Skill exchange marketplace
    - `tactic_boards` - Community tactical diagrams
    - `user_reputation` - Reputation scoring system
    - `reputation_activities` - Reputation change log
    - `content_flags` - Community moderation flags

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
    - Implement moderation controls

  3. Functions
    - Reputation calculation functions
    - Badge award automation
    - Content moderation helpers
*/

-- Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  team_name text NOT NULL,
  position text NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  video_url text,
  photo_url text,
  additional_info text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  review_notes text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification requests"
  ON verification_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests"
  ON verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderators can review verification requests"
  ON verification_requests
  FOR UPDATE
  TO authenticated
  USING (true); -- Add role-based restriction in production

-- Match Threads Table
CREATE TABLE IF NOT EXISTS match_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  participant_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE match_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active match threads"
  ON match_threads
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can create match threads"
  ON match_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Thread Messages Table
CREATE TABLE IF NOT EXISTS thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES match_threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'photo', 'video', 'heatmap', 'reaction')),
  media_url text,
  heatmap_data jsonb,
  reactions jsonb DEFAULT '{"fire": 0, "heart": 0, "thumbs_up": 0}',
  is_flagged boolean DEFAULT false,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view thread messages"
  ON thread_messages
  FOR SELECT
  TO authenticated
  USING (NOT is_flagged);

CREATE POLICY "Authenticated users can create messages"
  ON thread_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON thread_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Skill Swaps Table
CREATE TABLE IF NOT EXISTS skill_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_title text NOT NULL,
  offer_description text NOT NULL,
  request_title text NOT NULL,
  request_description text NOT NULL,
  skill_category text NOT NULL CHECK (skill_category IN ('technical', 'tactical', 'physical', 'mental')),
  difficulty_level text NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  media_urls text[] DEFAULT '{}',
  tactic_board_data jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'matched', 'completed', 'expired')),
  votes jsonb DEFAULT '{"helpful": 0, "not_helpful": 0}',
  matched_with uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE skill_swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active skill swaps"
  ON skill_swaps
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can manage own skill swaps"
  ON skill_swaps
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Tactic Boards Table
CREATE TABLE IF NOT EXISTS tactic_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  board_data jsonb NOT NULL, -- Tldraw data
  skill_category text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  votes integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tactic_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tactic boards"
  ON tactic_boards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tactic boards"
  ON tactic_boards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own tactic boards"
  ON tactic_boards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- User Reputation Table
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  badges text[] DEFAULT '{}',
  level integer DEFAULT 1,
  next_level_points integer DEFAULT 100,
  total_contributions integer DEFAULT 0,
  helpful_votes integer DEFAULT 0,
  verified_tips integer DEFAULT 0,
  flags_received integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reputation data"
  ON user_reputation
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own reputation"
  ON user_reputation
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reputation Activities Table
CREATE TABLE IF NOT EXISTS reputation_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  points_change integer NOT NULL,
  reason text NOT NULL,
  reference_id uuid, -- Reference to related content
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reputation_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reputation activities"
  ON reputation_activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Content Flags Table
CREATE TABLE IF NOT EXISTS content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('message', 'skill_swap', 'tactic_board')),
  content_id uuid NOT NULL,
  flagged_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create content flags"
  ON content_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "Moderators can view and manage flags"
  ON content_flags
  FOR ALL
  TO authenticated
  USING (true); -- Add role-based restriction in production

-- Notifications Table Enhancement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type text DEFAULT 'general';
    ALTER TABLE notifications ADD COLUMN data jsonb DEFAULT '{}';
  END IF;
END $$;

-- Functions for reputation management
CREATE OR REPLACE FUNCTION update_user_reputation(
  user_id uuid,
  points_change integer,
  reason text,
  reference_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_score integer;
  new_score integer;
  new_level integer;
BEGIN
  -- Get current score
  SELECT score INTO current_score
  FROM user_reputation
  WHERE user_reputation.user_id = update_user_reputation.user_id;
  
  -- Calculate new score
  new_score := GREATEST(0, current_score + points_change);
  
  -- Calculate new level
  new_level := FLOOR(SQRT(new_score / 100)) + 1;
  
  -- Update reputation
  UPDATE user_reputation
  SET 
    score = new_score,
    level = new_level,
    next_level_points = (new_level * new_level * 100) - new_score,
    updated_at = now()
  WHERE user_reputation.user_id = update_user_reputation.user_id;
  
  -- Log activity
  INSERT INTO reputation_activities (user_id, action_type, points_change, reason, reference_id)
  VALUES (update_user_reputation.user_id, 'points_change', points_change, reason, reference_id);
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id uuid)
RETURNS text[] AS $$
DECLARE
  user_rep user_reputation%ROWTYPE;
  new_badges text[] := '{}';
BEGIN
  -- Get user reputation data
  SELECT * INTO user_rep FROM user_reputation WHERE user_reputation.user_id = check_and_award_badges.user_id;
  
  -- Check for Drill Sergeant badge (10+ contributions)
  IF user_rep.total_contributions >= 10 AND NOT 'drill_sergeant' = ANY(user_rep.badges) THEN
    new_badges := array_append(new_badges, 'drill_sergeant');
  END IF;
  
  -- Check for Tactical Guru badge (5+ verified tips)
  IF user_rep.verified_tips >= 5 AND NOT 'tactical_guru' = ANY(user_rep.badges) THEN
    new_badges := array_append(new_badges, 'tactical_guru');
  END IF;
  
  -- Check for Community Hero badge (100+ helpful votes)
  IF user_rep.helpful_votes >= 100 AND NOT 'community_hero' = ANY(user_rep.badges) THEN
    new_badges := array_append(new_badges, 'community_hero');
  END IF;
  
  -- Update badges if any new ones earned
  IF array_length(new_badges, 1) > 0 THEN
    UPDATE user_reputation
    SET badges = badges || new_badges
    WHERE user_reputation.user_id = check_and_award_badges.user_id;
  END IF;
  
  RETURN new_badges;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_thread_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE match_threads
    SET participant_count = participant_count + 1,
        updated_at = now()
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE match_threads
    SET participant_count = GREATEST(0, participant_count - 1),
        updated_at = now()
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thread_participant_count_trigger
  AFTER INSERT OR DELETE ON thread_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_participant_count();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_match_threads_active ON match_threads(is_active);
CREATE INDEX IF NOT EXISTS idx_thread_messages_thread_id ON thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_messages_timestamp ON thread_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_skill_swaps_status ON skill_swaps(status);
CREATE INDEX IF NOT EXISTS idx_skill_swaps_category ON skill_swaps(skill_category);
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation(score);
CREATE INDEX IF NOT EXISTS idx_reputation_activities_user_id ON reputation_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status);

-- Insert sample data for testing
INSERT INTO match_threads (id, match_id, title, description, created_by) VALUES
  (gen_random_uuid(), (SELECT id FROM matches LIMIT 1), 'El Clasico Discussion', 'Live discussion for the biggest match of the season', (SELECT id FROM auth.users LIMIT 1)),
  (gen_random_uuid(), (SELECT id FROM matches LIMIT 1), 'Champions League Final', 'Real-time commentary and reactions', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Initialize reputation for existing users
INSERT INTO user_reputation (user_id, score, badges, level)
SELECT id, 0, '{}', 1
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_reputation)
ON CONFLICT DO NOTHING;