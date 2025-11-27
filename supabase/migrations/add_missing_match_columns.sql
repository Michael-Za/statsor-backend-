-- Add missing columns to matches table for full functionality
-- This migration adds all the columns that the application expects

-- Rename and add columns to match application expectations
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS opponent_name TEXT,
ADD COLUMN IF NOT EXISTS match_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS match_type TEXT,
ADD COLUMN IF NOT EXISTS is_home BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS formation TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS weather TEXT;

-- Add team_id if it doesn't exist (for single team perspective)
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON public.matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- Update existing matches to have default values
UPDATE public.matches
SET 
  home_score = COALESCE(home_score, 0),
  away_score = COALESCE(away_score, 0),
  status = COALESCE(status, 'scheduled'),
  is_home = COALESCE(is_home, true)
WHERE id IS NOT NULL;
