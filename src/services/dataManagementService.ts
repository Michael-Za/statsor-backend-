import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { playerManagementService } from './playerManagementService';

export interface Player {
  id?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  position: string;
  jersey_number?: number;
  number?: number;
  age?: number;
  nationality?: string;
  photo_url?: string;
  photo?: string;
  height?: number;
  weight?: number;
  preferred_foot?: string;
  dominantFoot?: string;
  secondaryPositions?: string[];
  birthDate?: Date;
  date_of_birth?: string;
  status?: string;
  team_id?: string;
  user_id?: string;
  goals?: number;
  assists?: number;
  shots?: number;
  shotsOnTarget?: number;
  shots_on_target?: number;
  passes?: number;
  pass_accuracy?: number;
  passAccuracy?: number;
  fouls_committed?: number;
  foulsCommitted?: number;
  fouls_received?: number;
  foulsReceived?: number;
  balls_lost?: number;
  ballsLost?: number;
  balls_recovered?: number;
  ballsRecovered?: number;
  duels_won?: number;
  duelsWon?: number;
  duels_lost?: number;
  duelsLost?: number;
  crosses?: number;
  saves?: number;
  minutes?: number;
  games?: number;
  yellow_cards?: number;
  yellowCards?: number;
  red_cards?: number;
  redCards?: number;
  email?: string;
  phone?: string;
  address?: string;
  contract_end?: string;
  salary?: number;
  fitness?: number;
  injuries?: string[];
  notes?: string;
  skills?: {
    technical: number;
    physical: number;
    tactical: number;
    mental: number;
  };
  medicalClearance?: boolean;
  lastMedicalCheck?: string;
  joinDate?: string;
  shotMap?: { [key: string]: number };
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
  owner_id?: string;
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
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClubData {
  id?: string;
  name: string;
  founded?: number;
  stadium?: string;
  capacity?: number;
  address?: string;
  phone?: string;
  email?: string;
  budget?: number;
  trophies?: number;
  notes?: string;
  president?: string;
  headCoach?: string;
  website?: string;
  staff?: {
    coaches?: number;
    medical?: number;
    administrative?: number;
  };
  facilities?: {
    trainingGrounds?: number;
    medicalCenter?: boolean;
    gym?: boolean;
    restaurant?: boolean;
  };
  [key: string]: any;
}

class DataManagementService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000;

  // Delegate player operations to PlayerManagementService
  async getPlayers(teamId?: string): Promise<Player[]> {
    try {
      const players = await playerManagementService.getPlayers(teamId);
      return players as Player[];
    } catch (error) {
      console.error('[DataService] Error getting players:', error);
      // Return empty array as fallback instead of throwing error
      return [];
    }
  }

  async getPlayer(id: string): Promise<Player | null> {
    return playerManagementService.getPlayer(id) as Promise<Player | null>;
  }

  async addPlayer(player: Player): Promise<Player | null> {
    const result = await playerManagementService.createPlayer(player as any);
    if (result.success) {
      return result.data as Player;
    }
    return null;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | null> {
    const result = await playerManagementService.updatePlayer(id, updates as any);
    if (result.success) {
      return result.data as Player;
    }
    return null;
  }

  async deletePlayer(id: string): Promise<boolean> {
    const result = await playerManagementService.deletePlayer(id);
    return result.success;
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id);

      if (error) {
        console.error('Error fetching teams:', error);
        return [];
      }

      return teams || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  async getTeam(id: string): Promise<Team | null> {
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching team:', error);
        return null;
      }

      return team;
    } catch (error) {
      console.error('Error fetching team:', error);
      return null;
    }
  }

  async addTeam(team: Team): Promise<Team | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to add teams');
        return null;
      }

      const { data, error } = await supabase
        .from('teams')
        .insert([{
          ...team,
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error adding team:', error);
        toast.error('Failed to add team');
        return null;
      }

      toast.success('Team added successfully');
      return data;
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('Failed to add team');
      return null;
    }
  }

  // Match operations
  async getMatches(teamId?: string): Promise<Match[]> {
    try {
      const userType = localStorage.getItem('user_type');

      if (userType === 'demo') {
        console.log('[DataService] Loading demo matches');
        const { demoAccountService } = await import('./demoAccountService');
        const demoMatches = demoAccountService.getDemoMatches();

        return demoMatches.map(match => {
          const scores = match.score.split('-');
          return {
            id: match.id,
            opponent_name: match.opponent,
            match_date: match.date,
            location: match.venue,
            match_type: match.competition,
            home_score: parseInt(scores[0] || '0'),
            away_score: parseInt(scores[1] || '0'),
            is_home: match.venue === 'home',
            status: 'completed',
            notes: '',
            weather: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[DataService] No authenticated user');
        return [];
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('[DataService] Profile lookup error:', profileError);
        return [];
      }

      console.log('[DataService] Loading matches for profile:', profile.id);

      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', profile.id);

      if (!teams || teams.length === 0) {
        console.log('[DataService] No teams found for user');
        return [];
      }

      const teamIds = teams.map((t: any) => t.id);

      let query = supabase
        .from('matches')
        .select('*')
        .in('team_id', teamIds);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data: matches, error } = await query;

      if (error) {
        console.error('Error fetching matches:', error);
        return [];
      }

      return matches || [];
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  }

  async addMatch(match: Match): Promise<Match | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to add matches');
        return null;
      }

      const { data, error } = await supabase
        .from('matches')
        .insert([{
          ...match,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error adding match:', error);
        toast.error('Failed to add match');
        return null;
      }

      toast.success('Match added successfully');
      return data;
    } catch (error) {
      console.error('Error adding match:', error);
      toast.error('Failed to add match');
      return null;
    }
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match | null> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating match:', error);
        toast.error('Failed to update match');
        return null;
      }

      toast.success('Match updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Failed to update match');
      return null;
    }
  }

  // Club data operations
  async getClubData(): Promise<ClubData | null> {
    try {
      const userType = localStorage.getItem('user_type');

      if (userType === 'demo') {
        console.log('[DataService] Loading demo club data');
        const { demoAccountService } = await import('./demoAccountService');
        return demoAccountService.getDemoClubData();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!profile) return null;

      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', profile.id);

      if (!teams || teams.length === 0) return null;

      const { data: clubData, error } = await supabase
        .from('club_data')
        .select('*')
        .eq('team_id', teams[0]?.id || '')
        .maybeSingle();

      if (error) {
        console.error('Error fetching club data:', error);
        return null;
      }

      return clubData;
    } catch (error) {
      console.error('Error fetching club data:', error);
      return null;
    }
  }

  async updateClubData(clubData: ClubData): Promise<ClubData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to update club data');
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('[DataService] Profile error:', profileError);
        return null;
      }

      const { data, error } = await supabase
        .from('club_data')
        .upsert({
          ...clubData,
          profile_id: profile.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating club data:', error);
        toast.error('Failed to update club data');
        return null;
      }

      toast.success('Club data updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating club data:', error);
      toast.error('Failed to update club data');
      return null;
    }
  }

  async exportToJSON(): Promise<string> {
    try {
      const exportData = {
        players: await this.getPlayers(),
        teams: await this.getTeams(),
        matches: await this.getMatches(),
        exportedAt: new Date().toISOString()
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importFromJSON(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);

      if (data.players && Array.isArray(data.players)) {
        for (const player of data.players) {
          await this.addPlayer(player);
        }
      }

      if (data.teams && Array.isArray(data.teams)) {
        for (const team of data.teams) {
          await this.addTeam(team);
        }
      }

      if (data.matches && Array.isArray(data.matches)) {
        for (const match of data.matches) {
          await this.addMatch(match);
        }
      }

      toast.success('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import data');
      return false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const dataManagementService = new DataManagementService();