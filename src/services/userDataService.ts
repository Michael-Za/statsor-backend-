import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface Player {
  id?: string;
  name: string;
  position: string;
  jersey_number?: number;
  age?: number;
  nationality?: string;
  photo_url?: string;
  height?: number;
  weight?: number;
  preferred_foot?: string;
  status?: string;
  team_id?: string;
  profile_id?: string;
  goals?: number;
  assists?: number;
  shots?: number;
  shots_on_target?: number;
  passes?: number;
  pass_accuracy?: number;
  fouls_committed?: number;
  fouls_received?: number;
  balls_lost?: number;
  balls_recovered?: number;
  duels_won?: number;
  duels_lost?: number;
  crosses?: number;
  saves?: number;
  minutes?: number;
  games?: number;
  yellow_cards?: number;
  red_cards?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Team {
  id?: string;
  name: string;
  sport: string;
  description?: string;
  logo_url?: string;
  formation?: string;
  manager_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Match {
  id?: string;
  team_id?: string;
  opponent_name: string;
  match_date: string;
  location?: string;
  match_type?: string;
  home_score?: number;
  away_score?: number;
  is_home?: boolean;
  status?: string;
  formation?: string;
  notes?: string;
  weather?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * UserDataService - Handles ALL data operations for REAL authenticated users
 * This service ONLY works with database data, never demo data
 */
class UserDataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000;

  private getCachedData(key: string): any | null {
    const isProduction = import.meta.env.PROD;
    if (isProduction) return null;
    
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    const isProduction = import.meta.env.PROD;
    if (isProduction) return;
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get current user's profile ID
   */
  private async getUserProfileId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[UserDataService] No authenticated user');
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (error || !profile) {
        console.error('[UserDataService] Profile error:', error);
        return null;
      }

      return profile.id;
    } catch (error) {
      console.error('[UserDataService] Error getting profile:', error);
      return null;
    }
  }

  /**
   * Get all players for the current user
   */
  async getPlayers(teamId?: string): Promise<Player[]> {
    try {
      console.log('[UserDataService] getPlayers called');
      
      const cacheKey = `user_players_${teamId || 'all'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log('[UserDataService] Returning cached players');
        return cached;
      }

      const profileId = await this.getUserProfileId();
      if (!profileId) {
        console.log('[UserDataService] No profile ID - returning empty array');
        return [];
      }

      console.log('[UserDataService] Profile ID:', profileId);

      let query = supabase
        .from('players')
        .select('*')
        .eq('profile_id', profileId);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data: players, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[UserDataService] Error fetching players:', error);
        toast.error('Failed to load players');
        return [];
      }

      console.log(`[UserDataService] Loaded ${players?.length || 0} players from database`);
      this.setCachedData(cacheKey, players || []);
      return players || [];
    } catch (error) {
      console.error('[UserDataService] Unexpected error:', error);
      return [];
    }
  }

  /**
   * Get a single player by ID
   */
  async getPlayer(id: string): Promise<Player | null> {
    try {
      console.log('[UserDataService] getPlayer called for ID:', id);
      
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        console.log('[UserDataService] No profile ID');
        return null;
      }

      const { data: player, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) {
        console.error('[UserDataService] Error fetching player:', error);
        return null;
      }

      console.log('[UserDataService] Player loaded:', player ? 'found' : 'not found');
      return player;
    } catch (error) {
      console.error('[UserDataService] Unexpected error:', error);
      return null;
    }
  }

  /**
   * Add a new player
   */
  async addPlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player | null> {
    try {
      console.log('[UserDataService] addPlayer called');
      
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        toast.error('Please sign in to add players');
        return null;
      }

      const { data, error } = await supabase
        .from('players')
        .insert([{
          ...player,
          profile_id: profileId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[UserDataService] Error adding player:', error);
        toast.error('Failed to add player');
        return null;
      }

      this.cache.clear();
      toast.success('Player added successfully');
      console.log('[UserDataService] Player added:', data.id);
      return data;
    } catch (error) {
      console.error('[UserDataService] Unexpected error:', error);
      toast.error('Failed to add player');
      return null;
    }
  }

  /**
   * Update a player
   */
  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | null> {
    try {
      console.log('[UserDataService] updatePlayer called for ID:', id);
      
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        toast.error('Please sign in to update players');
        return null;
      }

      const cleanUpdates = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      delete cleanUpdates.id;
      delete cleanUpdates.created_at;
      delete cleanUpdates.profile_id;

      const { data, error } = await supabase
        .from('players')
        .update(cleanUpdates)
        .eq('id', id)
        .eq('profile_id', profileId)
        .select()
        .single();

      if (error) {
        console.error('[UserDataService] Error updating player:', error);
        toast.error('Failed to update player');
        return null;
      }

      this.cache.clear();
      toast.success('Player updated successfully');
      console.log('[UserDataService] Player updated:', data.id);
      return data;
    } catch (error) {
      console.error('[UserDataService] Unexpected error:', error);
      toast.error('Failed to update player');
      return null;
    }
  }

  /**
   * Delete a player
   */
  async deletePlayer(id: string): Promise<boolean> {
    try {
      console.log('[UserDataService] deletePlayer called for ID:', id);
      
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        toast.error('Please sign in to delete players');
        return false;
      }

      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id)
        .eq('profile_id', profileId);

      if (error) {
        console.error('[UserDataService] Error deleting player:', error);
        toast.error('Failed to delete player');
        return false;
      }

      this.cache.clear();
      toast.success('Player deleted successfully');
      console.log('[UserDataService] Player deleted:', id);
      return true;
    } catch (error) {
      console.error('[UserDataService] Unexpected error:', error);
      toast.error('Failed to delete player');
      return false;
    }
  }

  /**
   * Get all teams for the current user
   */
  async getTeams(): Promise<Team[]> {
    try {
      console.log('[UserDataService] getTeams called');
      
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        return [];
      }

      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[UserDataService] Error fetching teams:', error);
        return [];
      }

      console.log(`[UserDataService] Loaded ${teams?.length || 0} teams`);
      return teams || [];
    } catch (error) {
      console.error('[UserDataService] Unexpected error:', error);
      return [];
    }
  }

  /**
   * Get all matches for the current user
   */
  async getMatches(teamId?: string): Promise<Match[]> {
    try {
      console.log('[UserDataService] getMatches called');
      
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        return [];
      }

      let query = supabase
        .from('matches')
        .select('*');

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data: matches, error } = await query.order('match_date', { ascending: false });

      if (error) {
        console.error('[UserDataService] Error fetching matches:', error);
        return [];
      }

      console.log(`[UserDataService] Loaded ${matches?.length || 0} matches`);
      return matches || [];
    } catch (error) {
      console.error('[UserDataService] Unexpected error:', error);
      return [];
    }
  }

  /**
   * Add a new match
   */
  async addMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>): Promise<Match | null> {
    try {
      console.log('[UserDataService] addMatch called');
      
      const profileId = await this.getUserProfileId();
      if (!profileId) {
        toast.error('Please sign in to add matches');
        return null;
      }

      const { data, error } = await supabase
        .from('matches')
        .insert([{
          ...match,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[UserDataService] Error adding match:', error);
        toast.error('Failed to add match');
        return null;
      }

      toast.success('Match added successfully');
      console.log('[UserDataService] Match added:', data.id);
      return data;
    } catch (error) {
      console.error('[UserDataService] Unexpected error:', error);
      toast.error('Failed to add match');
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[UserDataService] Cache cleared');
  }
}

export const userDataService = new UserDataService();
