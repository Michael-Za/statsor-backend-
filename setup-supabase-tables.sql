-- Essential tables for Statsor backend
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text,
  name text NOT NULL,
  picture text,
  provider text NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'google')),
  google_id text UNIQUE,
  sport text CHECK (sport IN ('soccer', 'futsal')),
  sport_selected boolean DEFAULT false,
  email_verified boolean DEFAULT false,
  language text DEFAULT 'es' CHECK (language IN ('en', 'es')),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  sport text NOT NULL CHECK (sport IN ('soccer', 'futsal')),
  category text,
  season text,
  coach_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sport_config jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  number integer,
  position text CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  birth_date date,
  photo_url text,
  stats jsonb DEFAULT '{}',
  statistics jsonb DEFAULT '{}',
  sport_specific_stats jsonb DEFAULT '{}',
  profile_image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, number)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  match_date timestamptz NOT NULL,
  venue text,
  sport text NOT NULL DEFAULT 'soccer' CHECK (sport IN ('soccer', 'futsal')),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled')),
  home_score integer DEFAULT 0,
  away_score integer DEFAULT 0,
  score jsonb DEFAULT '{"home": 0, "away": 0}',
  events jsonb DEFAULT '[]',
  statistics jsonb DEFAULT '{}',
  goal_locations jsonb DEFAULT '{"home": [], "away": []}',
  lineup jsonb DEFAULT '{}',
  match_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Training sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_date timestamptz NOT NULL,
  duration integer, -- in minutes
  exercises jsonb DEFAULT '[]',
  attendance jsonb DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type text NOT NULL, -- 'player', 'team', 'match'
  entity_id uuid NOT NULL,
  metric_name text NOT NULL,
  metric_value jsonb NOT NULL,
  recorded_at timestamptz DEFAULT now(),
  season text,
  created_at timestamptz DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  status text DEFAULT 'active',
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  response text,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_recorded_at ON analytics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_team_id ON training_sessions(team_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (adjust based on your needs)
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Coaches can manage own teams" ON teams FOR ALL TO authenticated USING (auth.uid() = coach_id);

CREATE POLICY "Team coaches can manage players" ON players FOR ALL TO authenticated 
USING (team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid()));

CREATE POLICY "Team coaches can manage matches" ON matches FOR ALL TO authenticated 
USING (home_team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid()) OR 
       away_team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid()));

CREATE POLICY "Users can manage own chat messages" ON chat_messages FOR ALL TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" ON subscriptions FOR ALL TO authenticated 
USING (auth.uid() = user_id);

-- Allow public read access for some tables (adjust as needed)
CREATE POLICY "Allow public read access to teams" ON teams FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to players" ON players FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to matches" ON matches FOR SELECT TO anon USING (true);