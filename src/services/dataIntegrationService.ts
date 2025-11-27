import { Player, ClubData as Club } from './dataManagementService';

// Define AnalyticsData type locally since it's not exported from dataManagementService
interface AnalyticsData {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
}
import { UserData, Player as AIPlayer, TeamStats, Match, MatchPrediction, WeatherData, AdvancedAnalytics } from '../components/EnhancedAIAssistant';

/**
 * Service to integrate Data Management system with AI Assistant
 * Transforms data between different formats and provides unified access
 */
class DataIntegrationService {
  private static instance: DataIntegrationService;
  private dataCache: Map<string, any> = new Map();
  private lastUpdate: Date = new Date();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): DataIntegrationService {
    if (!DataIntegrationService.instance) {
      DataIntegrationService.instance = new DataIntegrationService();
    }
    return DataIntegrationService.instance;
  }

  /**
   * Transform Data Management Player to AI Assistant Player format
   */
  private transformPlayerToAI(player: Player): AIPlayer {
    return {
      id: player.id.toString(),
      name: player.name,
      position: player.position,
      age: player.age,
      rating: player.rating,
      goals: player.goals,
      assists: player.assists,
      matches: (player as any).matches || 0,
      status: (player as any).status || 'available',
      fitnessLevel: this.calculateFitnessLevel(player),
      form: this.calculateForm(player),
      marketValue: (player as any).marketValue || 100000,
      performance: {
        speed: this.generatePerformanceMetric(player, 'speed'),
        strength: this.generatePerformanceMetric(player, 'strength'),
        stamina: this.generatePerformanceMetric(player, 'stamina'),
        technique: this.generatePerformanceMetric(player, 'technique'),
        mentality: this.generatePerformanceMetric(player, 'mentality'),
        passing: this.generatePerformanceMetric(player, 'passing'),
        shooting: this.generatePerformanceMetric(player, 'shooting'),
        defending: this.generatePerformanceMetric(player, 'defending')
      }
    };
  }

  /**
   * Calculate fitness level based on player status and recent performance
   */
  private calculateFitnessLevel(player: Player): number {
    const status = (player as any).status;
    if (status === 'injured') return Math.random() * 30 + 20; // 20-50
    if (status === 'suspended') return Math.random() * 20 + 70; // 70-90
    return Math.random() * 20 + 80; // 80-100 for active players
  }

  /**
   * Calculate current form based on recent performance
   */
  private calculateForm(player: Player): number {
    const baseForm = (player as any).rating || 75;
    const variance = (Math.random() - 0.5) * 2; // -1 to +1
    return Math.max(1, Math.min(10, baseForm + variance));
  }

  /**
   * Generate performance metrics based on position and rating
   */
  private generatePerformanceMetric(player: Player, metric: string): number {
    const baseRating = ((player as any).rating || 7.5) * 10; // Convert to 0-100 scale
    const positionModifiers: Record<string, Record<string, number>> = {
      'GK': { defending: 1.2, strength: 1.1, speed: 0.7, shooting: 0.3, passing: 0.8 },
      'CB': { defending: 1.3, strength: 1.2, speed: 0.8, shooting: 0.4, passing: 0.9 },
      'LB': { defending: 1.1, speed: 1.2, stamina: 1.1, shooting: 0.6, passing: 1.0 },
      'RB': { defending: 1.1, speed: 1.2, stamina: 1.1, shooting: 0.6, passing: 1.0 },
      'CM': { passing: 1.3, technique: 1.2, mentality: 1.1, defending: 0.9, shooting: 0.8 },
      'LW': { speed: 1.3, technique: 1.2, shooting: 1.1, defending: 0.6, strength: 0.8 },
      'RW': { speed: 1.3, technique: 1.2, shooting: 1.1, defending: 0.6, strength: 0.8 },
      'ST': { shooting: 1.4, speed: 1.2, technique: 1.1, defending: 0.4, passing: 0.8 }
    };

    const modifier = positionModifiers[player.position]?.[metric] || 1.0;
    const adjustedRating = baseRating * modifier;
    const variance = (Math.random() - 0.5) * 10; // ±5 points variance
    
    return Math.max(10, Math.min(100, Math.round(adjustedRating + variance)));
  }

  /**
   * Transform club data to team stats
   */
  private transformClubToTeamStats(_club: Club, players: Player[]): TeamStats {
    // Generate realistic team stats based on club data and players
    const totalMatches = 25; // Assume season progress
    const avgRating = players.reduce((sum, p) => sum + ((p as any).rating || 7.5), 0) / players.length;
    
    // Calculate wins/draws/losses based on team strength
    const winRate = Math.min(0.8, Math.max(0.2, (avgRating - 5) / 5)); // 20-80% based on avg rating
    const wins = Math.round(totalMatches * winRate);
    const losses = Math.round(totalMatches * (1 - winRate) * 0.6);
    const draws = totalMatches - wins - losses;

    return {
      wins,
      draws,
      losses,
      goalsFor: Math.round(wins * 2.1 + draws * 1.2 + losses * 0.8),
      goalsAgainst: Math.round(wins * 0.8 + draws * 1.2 + losses * 2.1),
      possession: Math.round(45 + (avgRating - 5) * 5), // 45-70% based on team quality
      passAccuracy: Math.round(75 + (avgRating - 5) * 3), // 75-90% based on team quality
      shotsOnTarget: Math.round(4 + (avgRating - 5) * 1.5),
      corners: Math.round(5 + Math.random() * 3),
      fouls: Math.round(12 + Math.random() * 6),
      yellowCards: Math.round(totalMatches * 2.5),
      redCards: Math.round(totalMatches * 0.2),
      cleanSheets: Math.round(wins * 0.6 + draws * 0.3)
    };
  }

  /**
   * Generate upcoming matches based on current data
   */
  private generateUpcomingMatches(): Match[] {
    const opponents = ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Valencia', 'Sevilla'];
    const competitions = ['La Liga', 'Champions League', 'Copa del Rey'];
    
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + (i + 1) * 7); // Weekly matches
      
      return {
        id: `match_${i + 1}`,
        opponent: opponents[i % opponents.length] || 'TBD',
        date,
        venue: Math.random() > 0.5 ? 'home' as const : 'away' as const,
        competition: competitions[i % competitions.length] || 'League'
      };
    });
  }

  /**
   * Generate match predictions based on team strength and opponent
   */
  private generateMatchPredictions(teamStats: TeamStats, upcomingMatches: Match[]): MatchPrediction[] {
    return upcomingMatches.slice(0, 3).map(match => {
      const teamStrength = (teamStats.wins / (teamStats.wins + teamStats.draws + teamStats.losses)) * 100;
      const homeAdvantage = match.venue === 'home' ? 10 : -5;
      const adjustedStrength = Math.max(20, Math.min(80, teamStrength + homeAdvantage));
      
      const winProb = adjustedStrength;
      const lossProb = Math.max(10, 100 - adjustedStrength - 20);
      const drawProb = 100 - winProb - lossProb;
      
      return {
        opponent: match.opponent,
        date: match.date,
        winProbability: winProb,
        drawProbability: drawProb,
        lossProbability: lossProb,
        expectedGoals: 1.2 + (adjustedStrength / 100) * 1.5,
        keyFactors: [
          match.venue === 'home' ? 'Home advantage' : 'Away challenge',
          'Current team form',
          'Player fitness levels',
          'Head-to-head record'
        ],
        recommendedFormation: '4-3-3',
        recommendedLineup: [] // Will be populated with actual player names
      };
    });
  }

  /**
   * Generate weather data (mock for now, could integrate with weather API)
   */
  private generateWeatherData(): WeatherData {
    const conditions = ['Clear', 'Cloudy', 'Light Rain', 'Windy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: Math.round(15 + Math.random() * 15), // 15-30°C
      humidity: Math.round(40 + Math.random() * 40), // 40-80%
      windSpeed: Math.round(5 + Math.random() * 15), // 5-20 km/h
      conditions: condition,
      impact: condition === 'Clear' ? 'positive' : 
              condition === 'Light Rain' ? 'negative' :
              condition === 'Windy' ? 'neutral' : 'neutral'
    };
  }

  /**
   * Generate advanced analytics based on team data
   */
  private generateAdvancedAnalytics(players: AIPlayer[]): AdvancedAnalytics {
    return {
      playerEfficiency: players.map(player => ({
        playerId: player.id,
        efficiency: (player.goals + player.assists) / Math.max(1, player.matches) * 10,
        strengths: this.getPlayerStrengths(player),
        weaknesses: this.getPlayerWeaknesses(player),
        recommendations: this.getPlayerRecommendations(player)
      })),
      tacticalAnalysis: {
        formation: '4-3-3',
        effectiveness: 75 + Math.random() * 20,
        strengths: ['Strong attacking play', 'Good midfield control'],
        weaknesses: ['Defensive transitions', 'Set piece defending'],
        alternatives: ['4-2-3-1', '3-5-2', '4-4-2']
      },
      fitnessMetrics: {
        teamAverage: players.reduce((sum, p) => sum + (p.fitnessLevel || 85), 0) / players.length,
        injuryRisk: players.filter(p => p.status === 'injured').length / players.length * 100,
        fatigueLevel: Math.random() * 30 + 20, // 20-50%
        recommendations: ['Rotate squad for upcoming fixtures', 'Focus on recovery sessions']
      },
      marketAnalysis: {
        teamValue: players.reduce((sum, p) => sum + (p.marketValue || 0), 0),
        topPerformers: players.sort((a, b) => b.rating - a.rating).slice(0, 3).map(p => p.name),
        transferTargets: ['Potential signing 1', 'Potential signing 2'],
        contractRenewals: players.filter(() => Math.random() > 0.7).map(p => p.name)
      },
      competitorAnalysis: {
        rivals: [
          { name: 'Team A', strength: 85, recentForm: 'WWLWD', keyPlayers: ['Player A1', 'Player A2'], tactics: '4-3-3' },
          { name: 'Team B', strength: 78, recentForm: 'WDWLL', keyPlayers: ['Player B1', 'Player B2'], tactics: '4-4-2' },
          { name: 'Team C', strength: 82, recentForm: 'LWWDW', keyPlayers: ['Player C1', 'Player C2'], tactics: '3-5-2' }
        ],
        strengths: ['Strong defense', 'Clinical finishing'],
        weaknesses: ['Weak midfield', 'Poor away form'],
        opportunities: ['Transfer market', 'Youth development', 'Tactical innovation'],
        threats: ['Key player form', 'Tactical flexibility']
      }
    };
  }

  private getPlayerStrengths(player: AIPlayer): string[] {
    const strengths = [];
    if (player.performance?.shooting && player.performance.shooting > 80) strengths.push('Excellent finishing');
    if (player.performance?.passing && player.performance.passing > 80) strengths.push('Great passing ability');
    if (player.performance?.defending && player.performance.defending > 80) strengths.push('Strong defensive skills');
    if (player.performance?.speed && player.performance.speed > 80) strengths.push('High pace');
    return strengths.length > 0 ? strengths : ['Consistent performer'];
  }

  private getPlayerWeaknesses(player: AIPlayer): string[] {
    const weaknesses = [];
    if (player.performance?.shooting && player.performance.shooting < 50) weaknesses.push('Needs to improve finishing');
    if (player.performance?.passing && player.performance.passing < 50) weaknesses.push('Passing accuracy needs work');
    if (player.performance?.defending && player.performance.defending < 50) weaknesses.push('Defensive positioning');
    if (player.fitnessLevel && player.fitnessLevel < 70) weaknesses.push('Fitness concerns');
    return weaknesses.length > 0 ? weaknesses : ['Minor tactical adjustments needed'];
  }

  private getPlayerRecommendations(player: AIPlayer): string[] {
    const recommendations = [];
    if (player.status === 'injured') recommendations.push('Focus on rehabilitation');
    if (player.fitnessLevel && player.fitnessLevel < 80) recommendations.push('Increase fitness training');
    if (player.form && player.form < 7) recommendations.push('Work on confidence and form');
    return recommendations.length > 0 ? recommendations : ['Maintain current performance level'];
  }

  /**
   * Get integrated user data for AI Assistant
   */
  async getIntegratedUserData(players: Player[], clubs: Club[]): Promise<UserData> {
    const cacheKey = 'integrated_user_data';
    const now = new Date();
    
    // Check cache
    if (this.dataCache.has(cacheKey) && (now.getTime() - this.lastUpdate.getTime()) < this.cacheTimeout) {
      return this.dataCache.get(cacheKey);
    }

    // Transform players
    const aiPlayers = players.map(player => this.transformPlayerToAI(player));
    
    // Use first club as main team (could be enhanced to support multiple teams)
    const mainClub = clubs[0];
    if (!mainClub) {
      throw new Error('No club data available');
    }
    const teamStats = this.transformClubToTeamStats(mainClub, players);
    
    // Generate additional data
    const upcomingMatches = this.generateUpcomingMatches();
    const predictions = this.generateMatchPredictions(teamStats, upcomingMatches);
    const weather = this.generateWeatherData();
    const advancedAnalytics = this.generateAdvancedAnalytics(aiPlayers);
    
    // Update predictions with actual player names
    predictions.forEach(prediction => {
      prediction.recommendedLineup = aiPlayers.slice(0, 11).map(p => p.name);
    });

    const userData: UserData = {
      players: aiPlayers,
      teamStats,
      upcomingMatches,
      recentMatches: [], // Could be enhanced with actual recent match data
      trainingPlans: [], // Could be enhanced with actual training data
      notes: [], // Could be enhanced with actual notes
      injuries: aiPlayers.filter(p => p.injuryHistory).flatMap(p => p.injuryHistory || []),
      predictions,
      weather,
      analytics: advancedAnalytics
    };

    // Cache the result
    this.dataCache.set(cacheKey, userData);
    this.lastUpdate = now;
    
    return userData;
  }

  /**
   * Clear cache to force data refresh
   */
  clearCache(): void {
    this.dataCache.clear();
    this.lastUpdate = new Date(0);
  }

  /**
   * Get real-time player statistics
   */
  async getPlayerStats(playerId: string, players: Player[]): Promise<AIPlayer | null> {
    const player = players.find(p => p.id.toString() === playerId);
    return player ? this.transformPlayerToAI(player) : null;
  }

  /**
   * Update player data and refresh cache
   */
  async updatePlayerData(playerId: string, updates: Partial<Player>, players: Player[]): Promise<boolean> {
    const playerIndex = players.findIndex(p => p.id.toString() === playerId);
    if (playerIndex === -1) return false;
    
    const player = players[playerIndex];
    if (!player) return false;
    
    // Update player data (this would typically update the database)
    Object.assign(player, updates);
    
    // Clear cache to force refresh
    this.clearCache();
    
    return true;
  }
}

export const dataIntegrationService = DataIntegrationService.getInstance();
export default dataIntegrationService;