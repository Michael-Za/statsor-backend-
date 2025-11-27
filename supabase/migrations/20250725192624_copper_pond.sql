-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Teams Table FIRST (without coach_id foreign key)
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  sport text NOT NULL CHECK (sport IN ('soccer', 'futsal')),
  category text,
  season text,
  sport_config jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add coach_id column to teams if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'coach_id'
  ) THEN
    ALTER TABLE teams ADD COLUMN coach_id uuid;
  END IF;
END $$;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text,
  first_name text,
  last_name text,
  provider text NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'google')),
  google_id text UNIQUE,
  avatar_url text,
  email_verified boolean DEFAULT false,
  email_verification_token text,
  password_reset_token text,
  password_reset_expires timestamptz,
  role text DEFAULT 'player' CHECK (role IN ('player', 'coach', 'manager', 'admin')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  position text CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  phone_number text,
  date_of_birth date,
  nationality text,
  sport text CHECK (sport IN ('soccer', 'futsal', 'football')),
  sport_selected boolean DEFAULT false,
  language text DEFAULT 'es' CHECK (language IN ('en', 'es')),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  preferences jsonb DEFAULT '{}',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to teams.coach_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'teams_coach_id_fkey'
  ) THEN
    ALTER TABLE teams ADD CONSTRAINT teams_coach_id_fkey 
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Coaches can manage own teams" ON teams FOR ALL TO authenticated USING (auth.uid() = coach_id);

-- Other tables...
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  number integer NOT NULL,
  position text NOT NULL CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  birth_date date,
  photo_url text,
  statistics jsonb DEFAULT '{}',
  sport_specific_stats jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, number)
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team coaches can manage players" ON players FOR ALL TO authenticated 
  USING (team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();