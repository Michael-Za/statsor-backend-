-- User Data Isolation Migration
-- This migration implements proper RLS policies to ensure users only see their own data

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable all for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for teams" ON public.teams;
DROP POLICY IF EXISTS "Enable all for players" ON public.players;
DROP POLICY IF EXISTS "Enable all for matches" ON public.matches;
DROP POLICY IF EXISTS "Enable all for player_statistics" ON public.player_statistics;
DROP POLICY IF EXISTS "Enable all for training_sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Enable all for subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable all for chat_messages" ON public.chat_messages;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Teams: Users can only see teams they manage
CREATE POLICY "Users can view own teams" ON public.teams
  FOR SELECT USING (
    manager_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own teams" ON public.teams
  FOR INSERT WITH CHECK (
    manager_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own teams" ON public.teams
  FOR UPDATE USING (
    manager_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own teams" ON public.teams
  FOR DELETE USING (
    manager_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Players: Users can only see players they own
CREATE POLICY "Users can view own players" ON public.players
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own players" ON public.players
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own players" ON public.players
  FOR UPDATE USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own players" ON public.players
  FOR DELETE USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Matches: Users can only see matches for their teams
CREATE POLICY "Users can view own matches" ON public.matches
  FOR SELECT USING (
    home_team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    ) OR
    away_team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own matches" ON public.matches
  FOR INSERT WITH CHECK (
    home_team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own matches" ON public.matches
  FOR UPDATE USING (
    home_team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own matches" ON public.matches
  FOR DELETE USING (
    home_team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Player Statistics: Users can only see stats for their players
CREATE POLICY "Users can view own player stats" ON public.player_statistics
  FOR SELECT USING (
    player_id IN (
      SELECT id FROM public.players WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own player stats" ON public.player_statistics
  FOR INSERT WITH CHECK (
    player_id IN (
      SELECT id FROM public.players WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own player stats" ON public.player_statistics
  FOR UPDATE USING (
    player_id IN (
      SELECT id FROM public.players WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own player stats" ON public.player_statistics
  FOR DELETE USING (
    player_id IN (
      SELECT id FROM public.players WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Training Sessions: Users can only see sessions for their teams
CREATE POLICY "Users can view own training sessions" ON public.training_sessions
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own training sessions" ON public.training_sessions
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own training sessions" ON public.training_sessions
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own training sessions" ON public.training_sessions
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE manager_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Subscriptions: Users can only see their own subscription
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Chat Messages: Users can only see their own messages
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON public.teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_players_profile_id ON public.players(profile_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON public.matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON public.matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Add function to automatically create user data space on profile creation
CREATE OR REPLACE FUNCTION public.initialize_user_data_space()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default team for new user
  INSERT INTO public.teams (name, sport, manager_id, description, created_at, updated_at)
  VALUES (
    NEW.first_name || '''s Team',
    COALESCE(NEW.sport, 'soccer'),
    NEW.id,
    'My team workspace',
    NOW(),
    NOW()
  );

  -- Create free subscription for new user
  INSERT INTO public.subscriptions (user_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
  VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-initialize user data space
DROP TRIGGER IF EXISTS trigger_initialize_user_data_space ON public.profiles;
CREATE TRIGGER trigger_initialize_user_data_space
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_data_space();

-- Add comment for documentation
COMMENT ON FUNCTION public.initialize_user_data_space() IS 
  'Automatically creates isolated data space (team, subscription) for new users';
