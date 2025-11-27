// Advanced Analytics utilities for TeamPlaymate platform

import { queryCacheService } from './database';

// Types for analytics
interface PlayerPosition {
  x: number; // 0-100 (percentage of field width)
  y: number; // 0-100 (percentage of field length)
  timestamp: number;
  playerId: string;
  eventType?: string;
}

interface PassEvent {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  timestamp: number;
  successful: boolean;
  passType: 'short' | 'medium' | 'long' | 'cross' | 'through';
  pressure: number; // 0-10 scale
}

interface ShotEvent {
  id: string;
  playerId: string;
  position: { x: number; y: number };
  timestamp: number;
  outcome: 'goal' | 'saved' | 'blocked' | 'wide' | 'over';
  bodyPart: 'left_foot' | 'right_foot' | 'head' | 'other';
  shotType: 'open_play' | 'free_kick' | 'penalty' | 'corner' | 'counter';
  distance: number;
  angle: number;
  pressure: number;
  assistPlayerId?: string;
}

interface HeatMapData {
  playerId: string;
  positions: PlayerPosition[];
  matchId: string;
  teamId: string;
}

// Heat Map Visualization Service
export class HeatMapService {
  private readonly FIELD_WIDTH = 100;
  private readonly FIELD_LENGTH = 100;
  private readonly GRID_SIZE = 5; // 5x5 meter grid cells

  /**
   * Generate heat map data for a player
   */
  async generatePlayerHeatMap(data: HeatMapData): Promise<{
    heatMap: number[][];
    hotspots: Array<{ x: number; y: number; intensity: number }>;
    coverage: number;
    averagePosition: { x: number; y: number };
    movementPatterns: string[];
  }> {
    const cacheKey = queryCacheService.generatePlayerKey(
      data.playerId,
      'heatmap',
      { matchId: data.matchId }
    );

    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const gridWidth = Math.ceil(this.FIELD_WIDTH / this.GRID_SIZE);
        const gridHeight = Math.ceil(this.FIELD_LENGTH / this.GRID_SIZE);
        const heatMap = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));

        // Process position data
        data.positions.forEach(pos => {
          const gridX = Math.floor(pos.x / this.GRID_SIZE);
          const gridY = Math.floor(pos.y / this.GRID_SIZE);
          
          if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
            heatMap[gridY][gridX]++;
          }
        });

        // Normalize heat map values
        const maxValue = Math.max(...heatMap.flat());
        const normalizedHeatMap = heatMap.map(row => 
          row.map(cell => maxValue > 0 ? cell / maxValue : 0)
        );

        const hotspots = this.findHotspots(normalizedHeatMap);
        const coverage = this.calculateCoverage(normalizedHeatMap);
        const averagePosition = this.calculateAveragePosition(data.positions);
        const movementPatterns = this.analyzeMovementPatterns(data.positions);

        return {
          heatMap: normalizedHeatMap,
          hotspots,
          coverage,
          averagePosition,
          movementPatterns
        };
      },
      600 // 10 minutes cache
    );
  }

  /**
   * Generate team heat map
   */
  async generateTeamHeatMap(teamId: string, matchId: string, playerData: HeatMapData[]): Promise<{
    teamHeatMap: number[][];
    formationShape: string;
    compactness: number;
    defensiveBlock: { x: number; y: number; width: number; height: number };
  }> {
    const cacheKey = queryCacheService.generateTeamKey(
      teamId,
      'team_heatmap',
      { matchId }
    );

    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const gridWidth = Math.ceil(this.FIELD_WIDTH / this.GRID_SIZE);
        const gridHeight = Math.ceil(this.FIELD_LENGTH / this.GRID_SIZE);
        const teamHeatMap = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));

        // Combine all player heat maps
        playerData.forEach(player => {
          player.positions.forEach(pos => {
            const gridX = Math.floor(pos.x / this.GRID_SIZE);
            const gridY = Math.floor(pos.y / this.GRID_SIZE);
            
            if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
              teamHeatMap[gridY][gridX]++;
            }
          });
        });

        // Normalize
        const maxValue = Math.max(...teamHeatMap.flat());
        const normalizedTeamHeatMap = teamHeatMap.map(row => 
          row.map(cell => maxValue > 0 ? cell / maxValue : 0)
        );

        const formationShape = this.identifyFormation(playerData);
        const compactness = this.calculateTeamCompactness(playerData);
        const defensiveBlock = this.calculateDefensiveBlock(playerData);

        return {
          teamHeatMap: normalizedTeamHeatMap,
          formationShape,
          compactness,
          defensiveBlock
        };
      },
      600
    );
  }

  private findHotspots(heatMap: number[][]): Array<{ x: number; y: number; intensity: number }> {
    const hotspots: Array<{ x: number; y: number; intensity: number }> = [];
    const threshold = 0.7; // 70% of maximum intensity

    for (let y = 0; y < heatMap.length; y++) {
      for (let x = 0; x < heatMap[y].length; x++) {
        if (heatMap[y][x] >= threshold) {
          hotspots.push({
            x: x * this.GRID_SIZE + this.GRID_SIZE / 2,
            y: y * this.GRID_SIZE + this.GRID_SIZE / 2,
            intensity: heatMap[y][x]
          });
        }
      }
    }

    return hotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 5);
  }

  private calculateCoverage(heatMap: number[][]): number {
    const totalCells = heatMap.length * heatMap[0].length;
    const occupiedCells = heatMap.flat().filter(cell => cell > 0).length;
    return (occupiedCells / totalCells) * 100;
  }

  private calculateAveragePosition(positions: PlayerPosition[]): { x: number; y: number } {
    if (positions.length === 0) return { x: 50, y: 50 };
    
    const sum = positions.reduce(
      (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
      { x: 0, y: 0 }
    );
    
    return {
      x: sum.x / positions.length,
      y: sum.y / positions.length
    };
  }

  private analyzeMovementPatterns(positions: PlayerPosition[]): string[] {
    const patterns: string[] = [];
    
    if (positions.length < 10) return patterns;
    
    // Analyze vertical movement
    const yPositions = positions.map(p => p.y);
    const yRange = Math.max(...yPositions) - Math.min(...yPositions);
    
    if (yRange > 40) patterns.push('High vertical mobility');
    else if (yRange < 15) patterns.push('Positionally disciplined');
    
    // Analyze horizontal movement
    const xPositions = positions.map(p => p.x);
    const xRange = Math.max(...xPositions) - Math.min(...xPositions);
    
    if (xRange > 30) patterns.push('Wide coverage');
    else if (xRange < 10) patterns.push('Central focus');
    
    // Analyze movement frequency
    const movements = this.calculateMovementDistance(positions);
    if (movements > 8000) patterns.push('High work rate');
    else if (movements < 4000) patterns.push('Conservative movement');
    
    return patterns;
  }

  private calculateMovementDistance(positions: PlayerPosition[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      
      totalDistance += distance;
    }
    
    return totalDistance;
  }

  private identifyFormation(playerData: HeatMapData[]): string {
    const avgPositions = playerData.map(player => 
      this.calculateAveragePosition(player.positions)
    );
    
    // Simple formation detection based on average positions
    const defenders = avgPositions.filter(pos => pos.y < 25).length;
    const midfielders = avgPositions.filter(pos => pos.y >= 25 && pos.y < 75).length;
    const forwards = avgPositions.filter(pos => pos.y >= 75).length;
    
    return `${defenders}-${midfielders}-${forwards}`;
  }

  private calculateTeamCompactness(playerData: HeatMapData[]): number {
    const avgPositions = playerData.map(player => 
      this.calculateAveragePosition(player.positions)
    );
    
    if (avgPositions.length < 2) return 0;
    
    let totalDistance = 0;
    let pairCount = 0;
    
    for (let i = 0; i < avgPositions.length; i++) {
      for (let j = i + 1; j < avgPositions.length; j++) {
        const distance = Math.sqrt(
          Math.pow(avgPositions[i].x - avgPositions[j].x, 2) +
          Math.pow(avgPositions[i].y - avgPositions[j].y, 2)
        );
        totalDistance += distance;
        pairCount++;
      }
    }
    
    const avgDistance = totalDistance / pairCount;
    return Math.max(0, 100 - avgDistance); // Higher score = more compact
  }

  private calculateDefensiveBlock(playerData: HeatMapData[]): { x: number; y: number; width: number; height: number } {
    const avgPositions = playerData.map(player => 
      this.calculateAveragePosition(player.positions)
    );
    
    const xPositions = avgPositions.map(pos => pos.x);
    const yPositions = avgPositions.map(pos => pos.y);
    
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions);
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}

// Pass Network Analysis Service
export class PassNetworkService {
  /**
   * Analyze pass network for a team
   */
  async analyzePassNetwork(teamId: string, matchId: string, passes: PassEvent[]): Promise<{
    network: Record<string, {
      playerId: string;
      connections: Record<string, {
        targetPlayerId: string;
        passCount: number;
        successRate: number;
        avgDistance: number;
      }>;
      centralityScore: number;
      position: { x: number; y: number };
    }>;
    keyConnections: Array<{
      from: string;
      to: string;
      strength: number;
      passCount: number;
    }>;
    networkMetrics: {
      density: number;
      centralization: number;
      avgPathLength: number;
    };
  }> {
    const cacheKey = queryCacheService.generateTeamKey(
      teamId,
      'pass_network',
      { matchId }
    );

    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const network = this.buildPassNetwork(passes);
        const keyConnections = this.identifyKeyConnections(network);
        const networkMetrics = this.calculateNetworkMetrics(network);

        return {
          network,
          keyConnections,
          networkMetrics
        };
      },
      600
    );
  }

  private buildPassNetwork(passes: PassEvent[]): Record<string, any> {
    const network: Record<string, any> = {};
    const playerPositions: Record<string, { x: number; y: number; count: number }> = {};

    // Initialize network nodes
    passes.forEach(pass => {
      if (!network[pass.fromPlayerId]) {
        network[pass.fromPlayerId] = {
          playerId: pass.fromPlayerId,
          connections: {},
          centralityScore: 0,
          position: { x: 0, y: 0 }
        };
      }
      
      if (!network[pass.toPlayerId]) {
        network[pass.toPlayerId] = {
          playerId: pass.toPlayerId,
          connections: {},
          centralityScore: 0,
          position: { x: 0, y: 0 }
        };
      }

      // Track player positions
      if (!playerPositions[pass.fromPlayerId]) {
        playerPositions[pass.fromPlayerId] = { x: 0, y: 0, count: 0 };
      }
      playerPositions[pass.fromPlayerId].x += pass.fromPosition.x;
      playerPositions[pass.fromPlayerId].y += pass.fromPosition.y;
      playerPositions[pass.fromPlayerId].count++;
    });

    // Calculate average positions
    Object.keys(playerPositions).forEach(playerId => {
      const pos = playerPositions[playerId];
      network[playerId].position = {
        x: pos.x / pos.count,
        y: pos.y / pos.count
      };
    });

    // Build connections
    passes.forEach(pass => {
      const fromPlayer = network[pass.fromPlayerId];
      const connectionKey = pass.toPlayerId;
      
      if (!fromPlayer.connections[connectionKey]) {
        fromPlayer.connections[connectionKey] = {
          targetPlayerId: pass.toPlayerId,
          passCount: 0,
          successCount: 0,
          totalDistance: 0
        };
      }
      
      const connection = fromPlayer.connections[connectionKey];
      connection.passCount++;
      if (pass.successful) connection.successCount++;
      
      const distance = Math.sqrt(
        Math.pow(pass.toPosition.x - pass.fromPosition.x, 2) +
        Math.pow(pass.toPosition.y - pass.fromPosition.y, 2)
      );
      connection.totalDistance += distance;
    });

    // Calculate connection metrics
    Object.values(network).forEach((player: any) => {
      Object.values(player.connections).forEach((connection: any) => {
        connection.successRate = connection.successCount / connection.passCount;
        connection.avgDistance = connection.totalDistance / connection.passCount;
      });
      
      // Calculate centrality score
      player.centralityScore = this.calculateCentralityScore(player, network);
    });

    return network;
  }

  private calculateCentralityScore(player: any, network: Record<string, any>): number {
    const totalConnections = Object.keys(player.connections).length;
    const totalPasses = Object.values(player.connections)
      .reduce((sum: number, conn: any) => sum + conn.passCount, 0);
    
    const avgSuccessRate = Object.values(player.connections)
      .reduce((sum: number, conn: any) => sum + conn.successRate, 0) / totalConnections || 0;
    
    return (totalConnections * 0.3) + (totalPasses * 0.4) + (avgSuccessRate * 30);
  }

  private identifyKeyConnections(network: Record<string, any>): Array<{
    from: string;
    to: string;
    strength: number;
    passCount: number;
  }> {
    const connections: Array<{
      from: string;
      to: string;
      strength: number;
      passCount: number;
    }> = [];

    Object.values(network).forEach((player: any) => {
      Object.values(player.connections).forEach((connection: any) => {
        const strength = connection.passCount * connection.successRate;
        connections.push({
          from: player.playerId,
          to: connection.targetPlayerId,
          strength,
          passCount: connection.passCount
        });
      });
    });

    return connections
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10); // Top 10 connections
  }

  private calculateNetworkMetrics(network: Record<string, any>): {
    density: number;
    centralization: number;
    avgPathLength: number;
  } {
    const playerCount = Object.keys(network).length;
    const maxPossibleConnections = playerCount * (playerCount - 1);
    
    let actualConnections = 0;
    Object.values(network).forEach((player: any) => {
      actualConnections += Object.keys(player.connections).length;
    });
    
    const density = actualConnections / maxPossibleConnections;
    
    // Calculate centralization
    const centralityScores = Object.values(network).map((player: any) => player.centralityScore);
    const maxCentrality = Math.max(...centralityScores);
    const avgCentrality = centralityScores.reduce((a, b) => a + b, 0) / centralityScores.length;
    const centralization = maxCentrality > 0 ? (maxCentrality - avgCentrality) / maxCentrality : 0;
    
    // Simplified average path length calculation
    const avgPathLength = playerCount > 1 ? 2.5 : 0; // Approximation for football networks
    
    return {
      density,
      centralization,
      avgPathLength
    };
  }
}

// Expected Goals (xG) Calculator
export class ExpectedGoalsService {
  private readonly XG_MODEL_WEIGHTS = {
    distance: -0.08,
    angle: 0.15,
    bodyPart: {
      right_foot: 0.0,
      left_foot: -0.05,
      head: -0.2,
      other: -0.3
    },
    shotType: {
      open_play: 0.0,
      free_kick: -0.1,
      penalty: 1.5,
      corner: -0.3,
      counter: 0.2
    },
    pressure: -0.05,
    assist: 0.1
  };

  /**
   * Calculate expected goals (xG) for a shot
   */
  calculateShotXG(shot: ShotEvent): {
    xG: number;
    factors: Record<string, number>;
    difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  } {
    const factors = {
      distance: this.calculateDistanceFactor(shot.distance),
      angle: this.calculateAngleFactor(shot.angle),
      bodyPart: this.XG_MODEL_WEIGHTS.bodyPart[shot.bodyPart] || 0,
      shotType: this.XG_MODEL_WEIGHTS.shotType[shot.shotType] || 0,
      pressure: shot.pressure * this.XG_MODEL_WEIGHTS.pressure,
      assist: shot.assistPlayerId ? this.XG_MODEL_WEIGHTS.assist : 0
    };

    // Base xG calculation using logistic regression approach
    const logit = Object.values(factors).reduce((sum, factor) => sum + factor, 0.3); // Base probability
    const xG = Math.max(0, Math.min(1, 1 / (1 + Math.exp(-logit))));

    const difficulty = this.categorizeDifficulty(xG);

    return { xG, factors, difficulty };
  }

  /**
   * Calculate team xG for a match
   */
  async calculateTeamXG(teamId: string, matchId: string, shots: ShotEvent[]): Promise<{
    totalXG: number;
    shotsBreakdown: Array<{
      shotId: string;
      xG: number;
      outcome: string;
      overperformance: number;
    }>;
    xGPerformance: {
      expected: number;
      actual: number;
      efficiency: number;
    };
  }> {
    const cacheKey = queryCacheService.generateTeamKey(
      teamId,
      'xg_analysis',
      { matchId }
    );

    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const shotsBreakdown = shots.map(shot => {
          const { xG } = this.calculateShotXG(shot);
          const actualValue = shot.outcome === 'goal' ? 1 : 0;
          const overperformance = actualValue - xG;
          
          return {
            shotId: shot.id,
            xG,
            outcome: shot.outcome,
            overperformance
          };
        });

        const totalXG = shotsBreakdown.reduce((sum, shot) => sum + shot.xG, 0);
        const actualGoals = shots.filter(shot => shot.outcome === 'goal').length;
        const efficiency = totalXG > 0 ? (actualGoals / totalXG) * 100 : 0;

        return {
          totalXG,
          shotsBreakdown,
          xGPerformance: {
            expected: totalXG,
            actual: actualGoals,
            efficiency
          }
        };
      },
      600
    );
  }

  /**
   * Calculate player xG statistics
   */
  async calculatePlayerXG(playerId: string, shots: ShotEvent[]): Promise<{
    totalXG: number;
    goalsScored: number;
    xGPerGoal: number;
    finishingAbility: number;
    shotQuality: number;
    preferredAreas: Array<{ x: number; y: number; xG: number }>;
  }> {
    const cacheKey = queryCacheService.generatePlayerKey(
      playerId,
      'xg_stats',
      { shotCount: shots.length }
    );

    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const playerShots = shots.filter(shot => shot.playerId === playerId);
        
        let totalXG = 0;
        const preferredAreas: Array<{ x: number; y: number; xG: number }> = [];
        
        playerShots.forEach(shot => {
          const { xG } = this.calculateShotXG(shot);
          totalXG += xG;
          
          preferredAreas.push({
            x: shot.position.x,
            y: shot.position.y,
            xG
          });
        });

        const goalsScored = playerShots.filter(shot => shot.outcome === 'goal').length;
        const xGPerGoal = goalsScored > 0 ? totalXG / goalsScored : 0;
        const finishingAbility = totalXG > 0 ? (goalsScored / totalXG) * 100 : 0;
        const shotQuality = playerShots.length > 0 ? totalXG / playerShots.length : 0;

        return {
          totalXG,
          goalsScored,
          xGPerGoal,
          finishingAbility,
          shotQuality,
          preferredAreas: this.clusterShotAreas(preferredAreas)
        };
      },
      600
    );
  }

  private calculateDistanceFactor(distance: number): number {
    // Distance in meters, closer shots have higher xG
    return this.XG_MODEL_WEIGHTS.distance * Math.log(Math.max(1, distance));
  }

  private calculateAngleFactor(angle: number): number {
    // Angle in degrees from goal center, smaller angles (more central) have higher xG
    const normalizedAngle = Math.abs(angle) / 90; // Normalize to 0-1
    return this.XG_MODEL_WEIGHTS.angle * (1 - normalizedAngle);
  }

  private categorizeDifficulty(xG: number): 'easy' | 'medium' | 'hard' | 'very_hard' {
    if (xG >= 0.4) return 'easy';
    if (xG >= 0.2) return 'medium';
    if (xG >= 0.1) return 'hard';
    return 'very_hard';
  }

  private clusterShotAreas(areas: Array<{ x: number; y: number; xG: number }>): Array<{ x: number; y: number; xG: number }> {
    // Simple clustering to identify preferred shooting areas
    const clusters: Array<{ x: number; y: number; xG: number; count: number }> = [];
    const threshold = 10; // 10 meter radius for clustering

    areas.forEach(area => {
      let addedToCluster = false;
      
      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(area.x - cluster.x, 2) + Math.pow(area.y - cluster.y, 2)
        );
        
        if (distance <= threshold) {
          // Add to existing cluster
          cluster.x = (cluster.x * cluster.count + area.x) / (cluster.count + 1);
          cluster.y = (cluster.y * cluster.count + area.y) / (cluster.count + 1);
          cluster.xG = (cluster.xG * cluster.count + area.xG) / (cluster.count + 1);
          cluster.count++;
          addedToCluster = true;
          break;
        }
      }
      
      if (!addedToCluster) {
        clusters.push({ ...area, count: 1 });
      }
    });

    return clusters
      .filter(cluster => cluster.count >= 2) // Only areas with multiple shots
      .sort((a, b) => b.xG - a.xG)
      .slice(0, 5)
      .map(cluster => ({ x: cluster.x, y: cluster.y, xG: cluster.xG }));
  }
}

// Export service instances
export const heatMapService = new HeatMapService();
export const passNetworkService = new PassNetworkService();
export const expectedGoalsService = new ExpectedGoalsService();

// Analytics orchestrator
export class AdvancedAnalyticsService {
  constructor(
    private heatMap = heatMapService,
    private passNetwork = passNetworkService,
    private xgService = expectedGoalsService
  ) {}

  /**
   * Get comprehensive match analytics
   */
  async getMatchAnalytics(matchId: string, teamId: string, data: {
    playerPositions: HeatMapData[];
    passes: PassEvent[];
    shots: ShotEvent[];
  }): Promise<{
    heatMaps: any;
    passNetwork: any;
    xgAnalysis: any;
    insights: string[];
  }> {
    const [heatMaps, passNetwork, xgAnalysis] = await Promise.all([
      this.heatMap.generateTeamHeatMap(teamId, matchId, data.playerPositions),
      this.passNetwork.analyzePassNetwork(teamId, matchId, data.passes),
      this.xgService.calculateTeamXG(teamId, matchId, data.shots)
    ]);

    const insights = this.generateMatchInsights(heatMaps, passNetwork, xgAnalysis);

    return {
      heatMaps,
      passNetwork,
      xgAnalysis,
      insights
    };
  }

  private generateMatchInsights(heatMaps: any, passNetwork: any, xgAnalysis: any): string[] {
    const insights: string[] = [];

    // Formation insights
    if (heatMaps.formationShape) {
      insights.push(`Team played in a ${heatMaps.formationShape} formation`);
    }

    // Compactness insights
    if (heatMaps.compactness > 70) {
      insights.push('Team maintained good defensive compactness');
    } else if (heatMaps.compactness < 40) {
      insights.push('Team was spread out, potentially vulnerable to counter-attacks');
    }

    // Pass network insights
    if (passNetwork.networkMetrics.centralization > 0.7) {
      insights.push('Play was heavily centralized through key players');
    }

    // xG insights
    if (xgAnalysis.xGPerformance.efficiency > 120) {
      insights.push('Clinical finishing - outperformed expected goals');
    } else if (xgAnalysis.xGPerformance.efficiency < 80) {
      insights.push('Poor finishing - underperformed expected goals');
    }

    return insights;
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();