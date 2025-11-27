/*
  # Enhanced Football Platform Schema

  1. New Tables
    - `chat_sessions` - Store chatbot conversations
    - `chat_messages` - Individual chat messages
    - `match_notes` - Match observation notes
    - `player_photos` - Player photo management
    - `analytics_reports` - Generated analytics data
    - `sport_configurations` - Sport-specific settings

  2. Enhanced Tables
    - Enhanced `matches` table with goal locations and sport type
    - Enhanced `players` table with photo support
    - Enhanced `teams` table with sport configuration

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
*/

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text DEFAULT 'general' CHECK (type IN ('general', 'tactical', 'analysis')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat sessions"
  ON chat_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('user', 'bot')),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'analysis', 'stats', 'chart', 'tutorial', 'suggestion')),
  data jsonb DEFAULT '{}',
  actions jsonb DEFAULT '[]',
  rating integer CHECK (rating IN (-1, 1)),
  feedback text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages in own sessions"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

-- Enhanced Matches Table
DO $$
BEGIN
  -- Add sport column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'sport'
  ) THEN
    ALTER TABLE matches ADD COLUMN sport text DEFAULT 'soccer' CHECK (sport IN ('soccer', 'futsal'));
  END IF;

  -- Add goal_locations column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'goal_locations'
  ) THEN
    ALTER TABLE matches ADD COLUMN goal_locations jsonb DEFAULT '{"home": [], "away": []}';
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'notes'
  ) THEN
    ALTER TABLE matches ADD COLUMN notes jsonb DEFAULT '[]';
  END IF;
END $$;

-- Match Notes Table (separate for better querying)
CREATE TABLE IF NOT EXISTS match_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  minute integer NOT NULL CHECK (minute >= 0 AND minute <= 120),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('tactical', 'performance', 'injury', 'general')),
  author_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE match_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage match notes"
  ON match_notes
  FOR ALL
  TO authenticated
  USING (true); -- Adjust based on your access control needs

-- Player Photos Table
CREATE TABLE IF NOT EXISTS player_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  thumbnail_url text,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE player_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage player photos"
  ON player_photos
  FOR ALL
  TO authenticated
  USING (true); -- Adjust based on your access control needs

-- Enhanced Players Table
DO $$
BEGIN
  -- Add photo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE players ADD COLUMN photo_url text;
  END IF;

  -- Add sport_specific_stats column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'sport_specific_stats'
  ) THEN
    ALTER TABLE players ADD COLUMN sport_specific_stats jsonb DEFAULT '{}';
  END IF;
END $$;

-- Enhanced Teams Table
DO $$
BEGIN
  -- Add sport column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'sport'
  ) THEN
    ALTER TABLE teams ADD COLUMN sport text DEFAULT 'soccer' CHECK (sport IN ('soccer', 'futsal'));
  END IF;

  -- Add sport_config column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'sport_config'
  ) THEN
    ALTER TABLE teams ADD COLUMN sport_config jsonb DEFAULT '{}';
  END IF;
END $$;

-- Analytics Reports Table
CREATE TABLE IF NOT EXISTS analytics_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('team_performance', 'player_analysis', 'match_analysis', 'season_summary')),
  entity_type text NOT NULL CHECK (entity_type IN ('team', 'player', 'match')),
  entity_id uuid NOT NULL,
  data jsonb NOT NULL,
  metadata jsonb DEFAULT '{}',
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access analytics reports"
  ON analytics_reports
  FOR SELECT
  TO authenticated
  USING (true); -- Adjust based on your access control needs

CREATE POLICY "Authorized users can create analytics reports"
  ON analytics_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Adjust based on your access control needs

-- Sport Configurations Table
CREATE TABLE IF NOT EXISTS sport_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL CHECK (sport IN ('soccer', 'futsal')),
  actions jsonb NOT NULL DEFAULT '[]',
  statistics jsonb NOT NULL DEFAULT '[]',
  rules jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sport_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read sport configurations"
  ON sport_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default sport configurations
INSERT INTO sport_configurations (sport, actions, statistics, rules) VALUES
('soccer', 
 '[
   {"id": "goal", "name": "Goal", "category": "offensive"},
   {"id": "assist", "name": "Assist", "category": "offensive"},
   {"id": "offside", "name": "Offside", "category": "offensive", "sport_specific": true},
   {"id": "penalty", "name": "Penalty", "category": "special", "sport_specific": true}
 ]',
 '[
   {"id": "goals", "name": "Goals", "category": "offensive"},
   {"id": "assists", "name": "Assists", "category": "offensive"},
   {"id": "clean_sheets", "name": "Clean Sheets", "category": "defensive", "sport_specific": true}
 ]',
 '{"match_duration": 90, "players_per_team": 11, "substitutions_allowed": 5}'
),
('futsal',
 '[
   {"id": "goal", "name": "Goal", "category": "offensive"},
   {"id": "assist", "name": "Assist", "category": "offensive"},
   {"id": "double_penalty_goal", "name": "Double Penalty Goal", "category": "special", "sport_specific": true},
   {"id": "accumulated_foul", "name": "Accumulated Foul", "category": "defensive", "sport_specific": true}
 ]',
 '[
   {"id": "goals", "name": "Goals", "category": "offensive"},
   {"id": "assists", "name": "Assists", "category": "offensive"},
   {"id": "double_penalty_goals", "name": "Double Penalty Goals", "category": "special", "sport_specific": true}
 ]',
 '{"match_duration": 40, "players_per_team": 5, "substitutions_allowed": -1}'
)
ON CONFLICT DO NOTHING;

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sport text CHECK (sport IN ('soccer', 'futsal')),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language text DEFAULT 'es' CHECK (language IN ('es', 'en')),
  notifications jsonb DEFAULT '{}',
  dashboard_config jsonb DEFAULT '{}',
  sport_selection_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_match_notes_match_id ON match_notes(match_id);
CREATE INDEX IF NOT EXISTS idx_match_notes_minute ON match_notes(minute);
CREATE INDEX IF NOT EXISTS idx_player_photos_player_id ON player_photos(player_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_entity ON analytics_reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_type ON analytics_reports(type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sport_configurations_updated_at
  BEFORE UPDATE ON sport_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();