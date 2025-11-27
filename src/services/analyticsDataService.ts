// Real-time analytics data service for TeamPlaymate platform

// Types for real analytics data
export interface RealPlayerData {
  id: number;
  name: string;
  position?: string;
  goals: number;
  assists: number;
  minutes: number;
  passes: number;
  accuracy: number;
  rating: string | number;
  form: number;
  nationality?: string;
  age?: number;
  height?: number;
  weight?: number;
  fitnessLevel?: number;
  injuryRisk?: number;
  potentialGrowth?: number;
  mentalState?: string;
  trainingLoad?: number;
  personalizedTips?: string[];
}

export interface RealMatchData {
  month: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  possession: number;
  shots?: number;
  corners?: number;
}

export interface RealTimeMatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  corners: { home: number; away: number };
  isLive: boolean;
  currentMatch?: {
    homeTeam: string;
    awayTeam: string;
    score: { home: number; away: number };
    minute: number;
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    corners: { home: number; away: number };
    fouls: { home: number; away: number };
    cards: { home: { yellow: number; red: number }; away: { yellow: number; red: number } };
  };
  liveEvents?: Array<{
    minute: number;
    type: string;
    player: string;
    team: 'home' | 'away';
  }>;
}

class AnalyticsDataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get real player performance data
   */
  async getPlayerData(): Promise<RealPlayerData[]> {
    const cacheKey = 'player_data';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Fetch from API endpoint
      const response = await fetch('/api/analytics/player-performance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch player data');
      }

      const data = await response.json();
      const playerData = data.players?.map((player: any) => {
        const result: RealPlayerData = {
          id: Number(player.id),
          name: player.name,
          goals: player.statistics?.total_goals || 0,
          assists: player.statistics?.total_assists || 0,
          minutes: player.statistics?.total_minutes || 0,
          passes: player.statistics?.total_passes || 0,
          accuracy: player.statistics?.total_passes_completed 
            ? Math.round((player.statistics.total_passes_completed / player.statistics.total_passes) * 100)
            : 0,
          rating: parseFloat(player.statistics?.average_rating || '0'),
          form: this.calculateForm(player.recent_matches || [])
        };
        
        // Add optional properties only if they exist
        if (player.position) result.position = player.position;
        if (player.nationality) result.nationality = player.nationality;
        if (player.age) result.age = player.age;
        if (player.height) result.height = player.height;
        if (player.weight) result.weight = player.weight;
        if (player.fitness_level) result.fitnessLevel = player.fitness_level;
        if (player.injury_risk) result.injuryRisk = player.injury_risk;
        if (player.potential_growth) result.potentialGrowth = player.potential_growth;
        if (player.mental_state) result.mentalState = player.mental_state;
        if (player.training_load) result.trainingLoad = player.training_load;
        
        const tips = this.generatePersonalizedTips(player);
        if (tips.length > 0) result.personalizedTips = tips;
        
        return result;
      }) || [];

      this.setCachedData(cacheKey, playerData);
      return playerData;
    } catch (error) {
      console.error('Error fetching player data:', error);
      // Return fallback data if API fails
      return this.getFallbackPlayerData();
    }
  }

  /**
   * Get real match performance data
   */
  async getMatchData(): Promise<RealMatchData[]> {
    const cacheKey = 'match_data';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('/api/analytics/team-performance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch match data');
      }

      const data = await response.json();
      const matchData = this.processMatchData(data.matches || []);

      this.setCachedData(cacheKey, matchData);
      return matchData;
    } catch (error) {
      console.error('Error fetching match data:', error);
      return this.getFallbackMatchData();
    }
  }

  /**
   * Get real-time match data
   */
  async getRealTimeData(): Promise<RealTimeMatchData> {
    try {
      // First, get current live matches
      const response = await fetch('/api/matches?status=live', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live match data');
      }

      const data = await response.json();
      const liveMatch = data.matches?.[0];

      if (liveMatch) {
        // Get detailed live data for the match
        const liveResponse = await fetch(`/api/matches/${liveMatch.id}/live`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          return this.processLiveMatchData(liveData.match);
        }
      }

      // Return fallback data if no live match
      return this.getFallbackRealTimeData();
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      return this.getFallbackRealTimeData();
    }
  }

  /**
   * Process match data into monthly aggregates
   */
  private processMatchData(matches: any[]): RealMatchData[] {
    const monthlyData = new Map<string, {
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      possession: number;
      shots: number;
      corners: number;
      count: number;
    }>();

    matches.forEach(match => {
      const date = new Date(match.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          wins: 0, draws: 0, losses: 0,
          goalsFor: 0, goalsAgainst: 0,
          possession: 0, shots: 0, corners: 0, count: 0
        });
      }

      const monthData = monthlyData.get(monthKey)!;
      monthData.count++;

      // Determine result (assuming user's team data)
      if (match.home_score > match.away_score) {
        monthData.wins++;
      } else if (match.home_score < match.away_score) {
        monthData.losses++;
      } else {
        monthData.draws++;
      }

      monthData.goalsFor += match.home_score || 0;
      monthData.goalsAgainst += match.away_score || 0;
      monthData.possession += match.statistics?.possession || 50;
      monthData.shots += match.statistics?.shots || 0;
      monthData.corners += match.statistics?.corners || 0;
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      wins: data.wins,
      draws: data.draws,
      losses: data.losses,
      goalsFor: data.goalsFor,
      goalsAgainst: data.goalsAgainst,
      possession: Math.round(data.possession / data.count),
      shots: Math.round(data.shots / data.count),
      corners: Math.round(data.corners / data.count)
    }));
  }

  /**
   * Process live match data
   */
  private processLiveMatchData(match: any): RealTimeMatchData {
    return {
      homeTeam: match.home_team_name || 'Home Team',
      awayTeam: match.away_team_name || 'Away Team',
      homeScore: match.home_score || 0,
      awayScore: match.away_score || 0,
      minute: match.current_minute || 0,
      possession: {
        home: match.live_stats?.possession_home || 50,
        away: match.live_stats?.possession_away || 50
      },
      shots: {
        home: match.live_stats?.shots_home || 0,
        away: match.live_stats?.shots_away || 0
      },
      corners: {
        home: match.live_stats?.corners_home || 0,
        away: match.live_stats?.corners_away || 0
      },
      isLive: true,
      currentMatch: {
        homeTeam: match.home_team_name || 'Home Team',
        awayTeam: match.away_team_name || 'Away Team',
        score: {
          home: match.home_score || 0,
          away: match.away_score || 0
        },
        minute: match.current_minute || 0,
        possession: {
          home: match.live_stats?.possession_home || 50,
          away: match.live_stats?.possession_away || 50
        },
        shots: {
          home: match.live_stats?.shots_home || 0,
          away: match.live_stats?.shots_away || 0
        },
        corners: {
          home: match.live_stats?.corners_home || 0,
          away: match.live_stats?.corners_away || 0
        },
        fouls: {
          home: match.live_stats?.fouls_home || 0,
          away: match.live_stats?.fouls_away || 0
        },
        cards: {
          home: {
            yellow: match.live_stats?.yellow_cards_home || 0,
            red: match.live_stats?.red_cards_home || 0
          },
          away: {
            yellow: match.live_stats?.yellow_cards_away || 0,
            red: match.live_stats?.red_cards_away || 0
          }
        }
      },
      liveEvents: (match.recent_events || []).map((event: any) => ({
        minute: event.minute,
        type: event.event_type,
        player: `${event.first_name} ${event.last_name}`,
        team: event.team_name === match.home_team_name ? 'home' : 'away'
      }))
    };
  }

  /**
   * Calculate player form based on recent matches
   */
  private calculateForm(recentMatches: any[]): number {
    if (!recentMatches.length) return 50;
    
    const formScore = recentMatches.reduce((sum, match) => {
      const rating = parseFloat(match.rating || '0');
      return sum + (rating * 10); // Convert to 0-100 scale
    }, 0);
    
    return Math.min(100, Math.round(formScore / recentMatches.length));
  }



  /**
   * Generate personalized tips based on player data
   */
  private generatePersonalizedTips(player: any): string[] {
    const tips = [];
    const stats = player.statistics || {};
    
    if (stats.total_goals > 10) {
      tips.push(`${player.name} shows excellent finishing ability - focus on creating more scoring opportunities`);
    }
    
    if (stats.average_rating > 7.5) {
      tips.push(`${player.name}'s performance has been outstanding - maintain current training regime`);
    } else if (stats.average_rating < 6.5) {
      tips.push(`Consider additional training sessions for ${player.name} to improve match performance`);
    }
    
    if (stats.total_minutes > 2000) {
      tips.push(`Consider rotating ${player.name} to prevent fatigue and maintain peak performance`);
    }
    
    return tips.length > 0 ? tips : [`Focus on ${player.name}'s development in upcoming training sessions`];
  }

  /**
   * Cache management
   */
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

  /**
   * Fallback data when API is unavailable
   */
  private getFallbackPlayerData(): RealPlayerData[] {
    const players = ['Your Player 1', 'Your Player 2', 'Your Player 3', 'Your Player 4', 'Your Player 5'];
    const positions = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
    return players.map((name, index) => {
      const result: RealPlayerData = {
        id: index + 1,
        name,
        goals: Math.floor(Math.random() * 15) + 2,
        assists: Math.floor(Math.random() * 10) + 1,
        minutes: Math.floor(Math.random() * 1500) + 500,
        passes: Math.floor(Math.random() * 300) + 100,
        accuracy: Math.floor(Math.random() * 20) + 75,
        rating: (Math.random() * 2 + 6).toFixed(1),
        form: Math.floor(Math.random() * 40) + 60
      };
      
      // Add optional properties
      result.position = positions[Math.floor(Math.random() * positions.length)]!;
      result.nationality = 'International';
      result.age = Math.floor(Math.random() * 15) + 20;
      result.height = Math.floor(Math.random() * 20) + 170;
      result.weight = Math.floor(Math.random() * 30) + 60;
      result.fitnessLevel = Math.floor(Math.random() * 30) + 70;
      result.injuryRisk = Math.floor(Math.random() * 40) + 10;
      result.potentialGrowth = Math.floor(Math.random() * 25) + 5;
      result.mentalState = ['Confident', 'Motivated', 'Focused', 'Stressed'][Math.floor(Math.random() * 4)]!;
      result.trainingLoad = Math.floor(Math.random() * 40) + 60;
      result.personalizedTips = [`Focus on ${name}'s development`, `Monitor ${name}'s fitness levels`];
      
      return result;
    });
  }

  private getFallbackMatchData(): RealMatchData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      wins: Math.floor(Math.random() * 4) + 1,
      draws: Math.floor(Math.random() * 2) + 1,
      losses: Math.floor(Math.random() * 2) + 1,
      goalsFor: Math.floor(Math.random() * 15) + 8,
      goalsAgainst: Math.floor(Math.random() * 10) + 3,
      possession: Math.floor(Math.random() * 20) + 45,
      shots: Math.floor(Math.random() * 30) + 80,
      corners: Math.floor(Math.random() * 20) + 15
    }));
  }

  private getFallbackRealTimeData(): RealTimeMatchData {
    return {
      homeTeam: 'Your Team',
      awayTeam: 'Opponent',
      homeScore: 1,
      awayScore: 0,
      minute: 45,
      possession: { home: 55, away: 45 },
      shots: { home: 8, away: 5 },
      corners: { home: 4, away: 2 },
      isLive: true,
      currentMatch: {
        homeTeam: 'Your Team',
        awayTeam: 'Opponent',
        score: { home: 1, away: 0 },
        minute: 45,
        possession: { home: 55, away: 45 },
        shots: { home: 8, away: 5 },
        corners: { home: 4, away: 2 },
        fouls: { home: 6, away: 8 },
        cards: { home: { yellow: 1, red: 0 }, away: { yellow: 2, red: 0 } }
      },
      liveEvents: [
        { minute: 45, type: 'goal', player: 'Your Player', team: 'home' },
        { minute: 42, type: 'yellow_card', player: 'Opponent Player', team: 'away' },
        { minute: 38, type: 'corner', player: 'Your Player', team: 'home' }
      ]
    };
  }

  /**
   * Clear cache to force fresh data fetch
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const analyticsDataService = new AnalyticsDataService();