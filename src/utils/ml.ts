// Machine Learning utilities for TeamPlaymate platform

import * as tf from '@tensorflow/tfjs';
import { queryCacheService } from './database';

// Types for ML models
interface PlayerPerformanceData {
  playerId: string;
  matchId: string;
  position: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  rating: number;
  physicalLoad: number;
  sprintDistance: number;
  heartRateAvg: number;
  previousRatings: number[];
}

interface InjuryRiskData {
  playerId: string;
  age: number;
  position: string;
  minutesPlayed: number;
  injuryHistory: Array<{
    type: string;
    severity: number;
    daysOut: number;
    date: Date;
  }>;
  physicalMetrics: {
    sprintSpeed: number;
    acceleration: number;
    workload: number;
    fatigueLevel: number;
    muscleStrain: number;
  };
  trainingLoad: number[];
  matchLoad: number[];
}

interface TacticalPattern {
  teamId: string;
  formation: string;
  possession: number;
  passAccuracy: number;
  attackingThird: number;
  defensiveActions: number;
  setPieces: number;
  counterAttacks: number;
  pressureIntensity: number;
  result: 'win' | 'draw' | 'loss';
}

// Player Performance Prediction Model
export class PlayerPerformancePredictionModel {
  private model: tf.LayersModel | null = null;
  private isTraining = false;
  private readonly modelPath = '/models/player-performance';

  constructor() {
    this.loadModel();
  }

  /**
   * Load pre-trained model or create new one
   */
  private async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`${this.modelPath}/model.json`);
      console.log('Player performance model loaded successfully');
    } catch (error) {
      console.log('Creating new player performance model');
      this.model = this.createModel();
    }
  }

  /**
   * Create neural network model for player performance prediction
   */
  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [15], // 15 input features
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid' // Output rating between 0-1 (scaled to 0-10)
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  /**
   * Preprocess player data for model input
   */
  private preprocessData(data: PlayerPerformanceData): number[] {
    const avgPreviousRating = data.previousRatings.length > 0 
      ? data.previousRatings.reduce((a, b) => a + b, 0) / data.previousRatings.length 
      : 5.0;

    const positionEncoding = this.encodePosition(data.position);
    
    return [
      data.minutesPlayed / 90, // Normalize to full match
      data.goals / 5, // Normalize goals
      data.assists / 5, // Normalize assists
      data.passes / 100, // Normalize passes
      data.passAccuracy / 100, // Already percentage
      data.tackles / 10, // Normalize tackles
      data.interceptions / 10, // Normalize interceptions
      data.physicalLoad / 100, // Normalize physical load
      data.sprintDistance / 1000, // Normalize sprint distance
      data.heartRateAvg / 200, // Normalize heart rate
      avgPreviousRating / 10, // Normalize previous ratings
      ...positionEncoding // Position one-hot encoding (4 values)
    ];
  }

  /**
   * Encode player position as one-hot vector
   */
  private encodePosition(position: string): number[] {
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    const encoding = [0, 0, 0, 0];
    const index = positions.indexOf(position.toUpperCase());
    if (index !== -1) {
      encoding[index] = 1;
    }
    return encoding;
  }

  /**
   * Predict player performance rating
   */
  async predictPerformance(data: PlayerPerformanceData): Promise<{
    predictedRating: number;
    confidence: number;
    factors: Record<string, number>;
  }> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const cacheKey = queryCacheService.generatePlayerKey(
      data.playerId, 
      'performance_prediction', 
      { matchId: data.matchId }
    );

    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const input = this.preprocessData(data);
        const prediction = this.model!.predict(tf.tensor2d([input])) as tf.Tensor;
        const result = await prediction.data();
        
        const predictedRating = result[0] * 10; // Scale back to 0-10
        const confidence = this.calculateConfidence(data);
        const factors = this.analyzeFactors(data);

        prediction.dispose();

        return {
          predictedRating: Math.round(predictedRating * 10) / 10,
          confidence,
          factors
        };
      },
      300 // 5 minutes cache
    );
  }

  /**
   * Calculate prediction confidence based on data quality
   */
  private calculateConfidence(data: PlayerPerformanceData): number {
    let confidence = 0.5; // Base confidence
    
    // More previous ratings = higher confidence
    if (data.previousRatings.length >= 5) confidence += 0.2;
    else if (data.previousRatings.length >= 3) confidence += 0.1;
    
    // Full match data = higher confidence
    if (data.minutesPlayed >= 80) confidence += 0.15;
    else if (data.minutesPlayed >= 45) confidence += 0.1;
    
    // Physical data availability
    if (data.physicalLoad > 0 && data.sprintDistance > 0) confidence += 0.15;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Analyze key performance factors
   */
  private analyzeFactors(data: PlayerPerformanceData): Record<string, number> {
    return {
      form: data.previousRatings.length > 0 
        ? data.previousRatings.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, data.previousRatings.length)
        : 5.0,
      fitness: (data.physicalLoad + data.sprintDistance / 100) / 2,
      technical: (data.passAccuracy + (data.goals + data.assists) * 10) / 2,
      defensive: data.tackles + data.interceptions,
      experience: Math.min(data.previousRatings.length / 10, 1) * 10
    };
  }

  /**
   * Train model with new data
   */
  async trainModel(trainingData: PlayerPerformanceData[]): Promise<void> {
    if (this.isTraining || !this.model) return;
    
    this.isTraining = true;
    
    try {
      const inputs = trainingData.map(data => this.preprocessData(data));
      const outputs = trainingData.map(data => data.rating / 10); // Normalize to 0-1
      
      const xs = tf.tensor2d(inputs);
      const ys = tf.tensor2d(outputs, [outputs.length, 1]);
      
      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
          }
        }
      });
      
      // Save updated model
      await this.model.save(`localstorage://${this.modelPath}`);
      
      xs.dispose();
      ys.dispose();
    } finally {
      this.isTraining = false;
    }
  }
}

// Injury Risk Assessment Model
export class InjuryRiskAssessmentModel {
  private model: tf.LayersModel | null = null;
  private readonly modelPath = '/models/injury-risk';

  constructor() {
    this.loadModel();
  }

  private async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`${this.modelPath}/model.json`);
    } catch (error) {
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [12],
          units: 48,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({
          units: 24,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 12,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 3,
          activation: 'softmax' // Low, Medium, High risk
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Assess injury risk for a player
   */
  async assessInjuryRisk(data: InjuryRiskData): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    probability: number;
    riskFactors: Record<string, number>;
    recommendations: string[];
  }> {
    if (!this.model) {
      throw new Error('Injury risk model not loaded');
    }

    const cacheKey = queryCacheService.generatePlayerKey(
      data.playerId,
      'injury_risk',
      { timestamp: Date.now() }
    );

    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const input = this.preprocessInjuryData(data);
        const prediction = this.model!.predict(tf.tensor2d([input])) as tf.Tensor;
        const result = await prediction.data();
        
        const riskProbabilities = {
          low: result[0],
          medium: result[1],
          high: result[2]
        };
        
        const maxRisk = Math.max(...Object.values(riskProbabilities));
        const riskLevel = Object.keys(riskProbabilities).find(
          key => riskProbabilities[key as keyof typeof riskProbabilities] === maxRisk
        ) as 'low' | 'medium' | 'high';
        
        const riskFactors = this.analyzeRiskFactors(data);
        const recommendations = this.generateRecommendations(riskLevel, riskFactors);
        
        prediction.dispose();
        
        return {
          riskLevel,
          probability: maxRisk,
          riskFactors,
          recommendations
        };
      },
      600 // 10 minutes cache
    );
  }

  private preprocessInjuryData(data: InjuryRiskData): number[] {
    const recentInjuries = data.injuryHistory.filter(
      injury => (Date.now() - injury.date.getTime()) < (365 * 24 * 60 * 60 * 1000)
    ).length;
    
    const avgTrainingLoad = data.trainingLoad.length > 0
      ? data.trainingLoad.reduce((a, b) => a + b, 0) / data.trainingLoad.length
      : 0;
    
    const avgMatchLoad = data.matchLoad.length > 0
      ? data.matchLoad.reduce((a, b) => a + b, 0) / data.matchLoad.length
      : 0;

    return [
      data.age / 40, // Normalize age
      data.minutesPlayed / 3000, // Normalize season minutes
      recentInjuries / 5, // Normalize injury count
      data.physicalMetrics.sprintSpeed / 35, // Normalize sprint speed
      data.physicalMetrics.acceleration / 10, // Normalize acceleration
      data.physicalMetrics.workload / 100, // Normalize workload
      data.physicalMetrics.fatigueLevel / 10, // Normalize fatigue
      data.physicalMetrics.muscleStrain / 10, // Normalize muscle strain
      avgTrainingLoad / 100, // Normalize training load
      avgMatchLoad / 100, // Normalize match load
      this.encodePosition(data.position)[0], // Position risk factor
      this.calculateInjuryHistorySeverity(data.injuryHistory) / 10 // Injury severity
    ];
  }

  private calculateInjuryHistorySeverity(history: InjuryRiskData['injuryHistory']): number {
    if (history.length === 0) return 0;
    
    const recentInjuries = history.filter(
      injury => (Date.now() - injury.date.getTime()) < (365 * 24 * 60 * 60 * 1000)
    );
    
    return recentInjuries.reduce((total, injury) => {
      return total + (injury.severity * injury.daysOut / 30);
    }, 0) / recentInjuries.length;
  }

  private analyzeRiskFactors(data: InjuryRiskData): Record<string, number> {
    return {
      age: Math.min(data.age / 35, 1) * 10,
      workload: data.physicalMetrics.workload / 10,
      fatigue: data.physicalMetrics.fatigueLevel,
      injuryHistory: this.calculateInjuryHistorySeverity(data.injuryHistory),
      muscleStrain: data.physicalMetrics.muscleStrain,
      trainingLoad: data.trainingLoad.slice(-5).reduce((a, b) => a + b, 0) / 5
    };
  }

  private generateRecommendations(riskLevel: string, factors: Record<string, number>): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'high') {
      recommendations.push('Consider rest or reduced training intensity');
      recommendations.push('Schedule medical assessment');
    }
    
    if (factors.fatigue > 7) {
      recommendations.push('Focus on recovery and sleep optimization');
    }
    
    if (factors.workload > 8) {
      recommendations.push('Reduce training volume for next 7 days');
    }
    
    if (factors.muscleStrain > 6) {
      recommendations.push('Increase stretching and mobility work');
    }
    
    return recommendations;
  }

  /**
   * Encode player position as one-hot vector
   */
  private encodePosition(position: string): number[] {
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    const encoding = [0, 0, 0, 0];
    const index = positions.indexOf(position.toUpperCase());
    if (index !== -1) {
      encoding[index] = 1;
    }
    return encoding;
  }
}

// Tactical Pattern Recognition Model
export class TacticalPatternRecognitionModel {
  private model: tf.LayersModel | null = null;
  private readonly modelPath = '/models/tactical-patterns';

  constructor() {
    this.loadModel();
  }

  private async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`${this.modelPath}/model.json`);
    } catch (error) {
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [9],
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 3,
          activation: 'softmax' // Win, Draw, Loss probability
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Analyze tactical patterns and predict match outcome
   */
  async analyzeTacticalPattern(data: TacticalPattern): Promise<{
    winProbability: number;
    drawProbability: number;
    lossProbability: number;
    keyFactors: Record<string, number>;
    tacticalInsights: string[];
  }> {
    if (!this.model) {
      throw new Error('Tactical pattern model not loaded');
    }

    const cacheKey = queryCacheService.generateTeamKey(
      data.teamId,
      'tactical_analysis',
      { formation: data.formation }
    );

    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const input = this.preprocessTacticalData(data);
        const prediction = this.model!.predict(tf.tensor2d([input])) as tf.Tensor;
        const result = await prediction.data();
        
        const keyFactors = this.analyzeTacticalFactors(data);
        const insights = this.generateTacticalInsights(data, keyFactors);
        
        prediction.dispose();
        
        return {
          winProbability: result[0],
          drawProbability: result[1],
          lossProbability: result[2],
          keyFactors,
          tacticalInsights: insights
        };
      },
      300 // 5 minutes cache
    );
  }

  private preprocessTacticalData(data: TacticalPattern): number[] {
    return [
      this.encodeFormation(data.formation),
      data.possession / 100,
      data.passAccuracy / 100,
      data.attackingThird / 100,
      data.defensiveActions / 50,
      data.setPieces / 20,
      data.counterAttacks / 10,
      data.pressureIntensity / 10,
      this.encodeResult(data.result)
    ];
  }

  private encodeFormation(formation: string): number {
    const formations: Record<string, number> = {
      '4-4-2': 0.1,
      '4-3-3': 0.2,
      '3-5-2': 0.3,
      '4-2-3-1': 0.4,
      '5-3-2': 0.5,
      '3-4-3': 0.6
    };
    return formations[formation] || 0.1;
  }

  private encodeResult(result: string): number {
    const results: Record<string, number> = {
      'win': 1,
      'draw': 0.5,
      'loss': 0
    };
    return results[result] || 0.5;
  }

  private analyzeTacticalFactors(data: TacticalPattern): Record<string, number> {
    return {
      possession: data.possession,
      efficiency: (data.passAccuracy + data.attackingThird) / 2,
      defensive: data.defensiveActions,
      setPlay: data.setPieces,
      transition: data.counterAttacks,
      intensity: data.pressureIntensity
    };
  }

  private generateTacticalInsights(data: TacticalPattern, factors: Record<string, number>): string[] {
    const insights: string[] = [];
    
    if (data.possession > 60) {
      insights.push('High possession-based approach - focus on patient build-up');
    } else if (data.possession < 40) {
      insights.push('Counter-attacking style - efficient transitions key');
    }
    
    if (data.pressureIntensity > 7) {
      insights.push('High-intensity pressing - monitor player fatigue');
    }
    
    if (data.setPieces > 15) {
      insights.push('Strong set-piece threat - defensive organization crucial');
    }
    
    if (data.counterAttacks > 8) {
      insights.push('Dangerous on the break - compact defensive shape needed');
    }
    
    return insights;
  }
}

// Export model instances
export const playerPerformanceModel = new PlayerPerformancePredictionModel();
export const injuryRiskModel = new InjuryRiskAssessmentModel();
export const tacticalPatternModel = new TacticalPatternRecognitionModel();

// ML Service orchestrator
export class MLService {
  constructor(
    private performanceModel = playerPerformanceModel,
    private injuryModel = injuryRiskModel,
    private tacticalModel = tacticalPatternModel
  ) {}

  /**
   * Get comprehensive player analysis
   */
  async getPlayerAnalysis(playerId: string, matchData: any): Promise<{
    performance: any;
    injuryRisk: any;
  }> {
    const [performance, injuryRisk] = await Promise.all([
      this.performanceModel.predictPerformance(matchData),
      this.injuryModel.assessInjuryRisk(matchData)
    ]);

    return { performance, injuryRisk };
  }

  /**
   * Get team tactical analysis
   */
  async getTeamTacticalAnalysis(teamId: string, tacticalData: TacticalPattern): Promise<any> {
    return this.tacticalModel.analyzeTacticalPattern(tacticalData);
  }
}

export const mlService = new MLService();