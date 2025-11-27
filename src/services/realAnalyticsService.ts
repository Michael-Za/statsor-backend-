import { supabase } from '../lib/supabase';

export interface RealTeamStats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
  totalAssists: number;
  foulsCommitted: number;
  foulsReceived: number;
}

export interface RealPlayerPerformance {
  playerId: string;
  name: string;
  position: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  averageRating: number;
  totalMinutes: number;
  passAccuracy: number;
  form: number;
}

export interface RealMatchPerformance {
  month: string;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export interface RealPositionStats {
  position: string;
  playerCount: number;
  totalGoals: number;
  totalAssists: number;
  averageRating: number;
}

class RealAnalyticsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000;

  async getTeamStats(userId: string): Promise<RealTeamStats> {
    const cacheKey = `team_stats_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (teamError || !userTeam) {
        console.log('Team not found, using fallback data');
        return this.getFallbackTeamStats();
      }

      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', userTeam.id)
        .eq('status', 'completed');

      if (matchError || !matches) {
        console.log('Matches not found, using fallback data');
        return this.getFallbackTeamStats();
      }

      const stats = this.calculateTeamStats(matches, userTeam.id);
      this.setCachedData(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return this.getFallbackTeamStats();
    }
  }

  async getPlayerPerformance(userId: string): Promise<RealPlayerPerformance[]> {
    const cacheKey = `player_performance_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (teamError || !userTeam) {
        console.log('Team not found for player performance, using fallback data');
        return this.getFallbackPlayerPerformance();
      }

      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, position')
        .eq('team_id', userTeam.id);

      if (playersError || !players || players.length === 0) {
        console.log('Players not found, using fallback data');
        return this.getFallbackPlayerPerformance();
      }

      const { data: playerStats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .in('player_id', players.map(p => p.id));

      const performance = players.map((player) => {
        const stats = (playerStats || []).filter(s => s.player_id === player.id);
        const totalGoals = stats.reduce((sum, s) => sum + (s.goals || 0), 0);
        const totalAssists = stats.reduce((sum, s) => sum + (s.assists || 0), 0);
        const totalMinutes = stats.reduce((sum, s) => sum + (s.minutes_played || 0), 0);
        const avgRating = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.rating || 0), 0) / stats.length : 0;
        const totalPasses = stats.reduce((sum, s) => sum + (s.passes_attempted || 0), 0);
        const totalPassesCompleted = stats.reduce((sum, s) => sum + (s.passes_completed || 0), 0);

        return {
          playerId: player.id,
          name: player.name,
          position: player.position || 'Unknown',
          matchesPlayed: stats.length,
          goals: totalGoals,
          assists: totalAssists,
          averageRating: Math.round(avgRating * 10) / 10,
          totalMinutes,
          passAccuracy: totalPasses > 0 ? Math.round((totalPassesCompleted / totalPasses) * 100) : 0,
          form: Math.min(100, Math.max(0, Math.round(avgRating * 10)))
        };
      });

      this.setCachedData(cacheKey, performance);
      return performance;
    } catch (error) {
      console.error('Error fetching player performance:', error);
      return this.getFallbackPlayerPerformance();
    }
  }

  async getMonthlyPerformance(userId: string): Promise<RealMatchPerformance[]> {
    const cacheKey = `monthly_performance_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (teamError || !userTeam) {
        console.log('Team not found for monthly performance, using fallback data');
        return this.getFallbackMonthlyPerformance();
      }

      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', userTeam.id)
        .eq('status', 'completed')
        .gte('match_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (matchError || !matches) {
        console.log('Matches not found for monthly performance, using fallback data');
        return this.getFallbackMonthlyPerformance();
      }

      const monthlyData = this.groupMatchesByMonth(matches, userTeam.id);
      this.setCachedData(cacheKey, monthlyData);
      return monthlyData;
    } catch (error) {
      console.error('Error fetching monthly performance:', error);
      return this.getFallbackMonthlyPerformance();
    }
  }

  async getPositionStats(userId: string): Promise<RealPositionStats[]> {
    const cacheKey = `position_stats_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (teamError || !userTeam) {
        console.log('Team not found for position stats, using fallback data');
        return this.getFallbackPositionStats();
      }

      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, position')
        .eq('team_id', userTeam.id);

      if (playersError || !players || players.length === 0) {
        console.log('Players not found for position stats, using fallback data');
        return this.getFallbackPositionStats();
      }

      const { data: playerStats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .in('player_id', players.map(p => p.id));

      const positionData = this.calculatePositionStats(players, playerStats || []);
      this.setCachedData(cacheKey, positionData);
      return positionData;
    } catch (error) {
      console.error('Error fetching position stats:', error);
      return this.getFallbackPositionStats();
    }
  }

  private calculateTeamStats(matches: any[], teamId: string): RealTeamStats {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    matches.forEach(match => {
      const teamScore = match.is_home ? match.home_score : match.away_score;
      const opponentScore = match.is_home ? match.away_score : match.home_score;

      goalsFor += teamScore || 0;
      goalsAgainst += opponentScore || 0;

      if (teamScore > opponentScore) wins++;
      else if (teamScore === opponentScore) draws++;
      else losses++;
    });

    const totalMatches = matches.length;
    const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      totalMatches,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      winPercentage: Math.round(winPercentage * 10) / 10,
      totalAssists: 0,
      foulsCommitted: 0,
      foulsReceived: 0
    };
  }

  private groupMatchesByMonth(matches: any[], teamId: string): RealMatchPerformance[] {
    const monthlyData: { [key: string]: RealMatchPerformance } = {};

    matches.forEach(match => {
      const date = new Date(match.match_date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          matchesPlayed: 0
        };
      }

      const teamScore = match.is_home ? match.home_score : match.away_score;
      const opponentScore = match.is_home ? match.away_score : match.home_score;

      monthlyData[monthKey].matchesPlayed++;
      monthlyData[monthKey].goals += teamScore || 0;

      if (teamScore > opponentScore) monthlyData[monthKey].wins++;
      else if (teamScore === opponentScore) monthlyData[monthKey].draws++;
      else monthlyData[monthKey].losses++;
    });

    return Object.values(monthlyData).sort((a, b) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });
  }

  private calculatePositionStats(players: any[], playerStats: any[]): RealPositionStats[] {
    const positionData: { [key: string]: RealPositionStats } = {};

    players.forEach(player => {
      const position = player.position || 'Unknown';
      const stats = playerStats.filter(s => s.player_id === player.id);
      const totalGoals = stats.reduce((sum, s) => sum + (s.goals || 0), 0);
      const totalAssists = stats.reduce((sum, s) => sum + (s.assists || 0), 0);
      const avgRating = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.rating || 0), 0) / stats.length : 0;

      if (!positionData[position]) {
        positionData[position] = {
          position,
          playerCount: 0,
          totalGoals: 0,
          totalAssists: 0,
          averageRating: 0
        };
      }

      positionData[position].playerCount++;
      positionData[position].totalGoals += totalGoals;
      positionData[position].totalAssists += totalAssists;
      positionData[position].averageRating += avgRating;
    });

    Object.values(positionData).forEach(pos => {
      if (pos.playerCount > 0) {
        pos.averageRating = Math.round((pos.averageRating / pos.playerCount) * 10) / 10;
      }
    });

    return Object.values(positionData);
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getFallbackTeamStats(): RealTeamStats {
    return {
      totalMatches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      winPercentage: 0,
      totalAssists: 0,
      foulsCommitted: 0,
      foulsReceived: 0
    };
  }

  private getFallbackPlayerPerformance(): RealPlayerPerformance[] {
    return [];
  }

  private getFallbackMonthlyPerformance(): RealMatchPerformance[] {
    return [];
  }

  private getFallbackPositionStats(): RealPositionStats[] {
    return [];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const realAnalyticsService = new RealAnalyticsService();
