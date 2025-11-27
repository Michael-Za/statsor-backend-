-- Add missing columns to players table for full functionality
-- This migration adds all the columns that the application expects

-- Add basic player information columns
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add statistics columns
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS goals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assists INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS games INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS yellow_cards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS red_cards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shots_on_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pass_accuracy DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fouls_committed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fouls_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS balls_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS balls_recovered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duels_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duels_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS crosses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0;

-- Add additional player details
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS fitness INTEGER DEFAULT 85,
ADD COLUMN IF NOT EXISTS injuries TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS medical_clearance BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_medical_check DATE,
ADD COLUMN IF NOT EXISTS join_date DATE;

-- Add skills columns (stored as JSONB for flexibility)
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{"technical": 80, "physical": 80, "tactical": 80, "mental": 80}'::jsonb;

-- Add shot map (stored as JSONB)
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS shot_map JSONB DEFAULT '{
  "top-left": 0, "top-center": 0, "top-right": 0,
  "middle-left": 0, "middle-center": 0, "middle-right": 0,
  "bottom-left": 0, "bottom-center": 0, "bottom-right": 0
}'::jsonb;

-- Add secondary positions array
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS secondary_positions TEXT[];

-- Create index on profile_id for faster queries
CREATE INDEX IF NOT EXISTS idx_players_profile_id ON public.players(profile_id);

-- Create index on name for search
CREATE INDEX IF NOT EXISTS idx_players_name ON public.players(name);

-- Create index on position for filtering
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(position);

-- Update existing players to have default values for new columns
UPDATE public.players
SET 
  goals = COALESCE(goals, 0),
  assists = COALESCE(assists, 0),
  minutes = COALESCE(minutes, 0),
  games = COALESCE(games, 0),
  yellow_cards = COALESCE(yellow_cards, 0),
  red_cards = COALESCE(red_cards, 0),
  fitness = COALESCE(fitness, 85),
  medical_clearance = COALESCE(medical_clearance, true),
  skills = COALESCE(skills, '{"technical": 80, "physical": 80, "tactical": 80, "mental": 80}'::jsonb),
  shot_map = COALESCE(shot_map, '{
    "top-left": 0, "top-center": 0, "top-right": 0,
    "middle-left": 0, "middle-center": 0, "middle-right": 0,
    "bottom-left": 0, "bottom-center": 0, "bottom-right": 0
  }'::jsonb)
WHERE id IS NOT NULL;
