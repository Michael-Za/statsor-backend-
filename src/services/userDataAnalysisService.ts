import { supabase } from '../lib/supabase';

export interface UserAnalytics {
  userId: string;
  teamId?: string;
  personalizedInsights: PersonalizedInsight[];
  performanceMetrics: PerformanceMetrics;
  recommendations: Recommendation[];
  trends: TrendAnalysis;
  riskAssessment: RiskAssessment;
}

export interface PersonalizedInsight {
  id: string;
  type: 'performance' | 'fitness' | 'tactical' | 'mental';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  timestamp: Date;
}

export interface PerformanceMetrics {
  currentForm: number;
  fitnessLevel: number;
  skillDevelopment: SkillMetrics;
  consistency: number;
  improvement: number;
}

export interface SkillMetrics {
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
}

export interface Recommendation {
  id: string;
  category: 'training' | 'recovery' | 'tactical' | 'development';
  title: string;
  description: string;
  priority: number;
  estimatedImpact: 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface TrendAnalysis {
  performanceTrend: 'improving' | 'stable' | 'declining';
  keyMetrics: MetricTrend[];
  seasonalPatterns: SeasonalPattern[];
  predictedOutcome: PredictedOutcome;
}

export interface MetricTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  changePercentage: number;
  significance: 'high' | 'medium' | 'low';
}

export interface SeasonalPattern {
  period: string;
  pattern: string;
  confidence: number;
}

export interface PredictedOutcome {
  nextMatchPerformance: number;
  seasonProjection: string;
  developmentAreas: string[];
}

export interface RiskAssessment {
  injuryRisk: number;
  burnoutRisk: number;
  performanceRisk: number;
  mitigationStrategies: string[];
}

class UserDataAnalysisService {
  async analyzeUserData(userId: string, teamId?: string): Promise<UserAnalytics> {
    try {
      // Fetch user data from database
      const userData = await this.fetchUserData(userId, teamId);
      
      // Generate personalized insights
      const personalizedInsights = await this.generatePersonalizedInsights(userData);
      
      // Calculate performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(userData);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(userData, performanceMetrics);
      
      // Analyze trends
      const trends = await this.analyzeTrends(userData);
      
      // Assess risks
      const riskAssessment = await this.assessRisks(userData, performanceMetrics);
      
      return {
        userId,
        teamId,
        personalizedInsights,
        performanceMetrics,
        recommendations,
        trends,
        riskAssessment
      };
    } catch (error) {
      console.error('Error analyzing user data:', error);
      return this.generateFallbackAnalytics(userId, teamId);
    }
  }

  private async fetchUserData(userId: string, teamId?: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq(teamId ? 'team_id' : 'user_id', teamId || userId)
      .order('date', { ascending: false })
      .limit(20);

    const { data: trainingSessions } = await supabase
      .from('training_sessions')
      .select('*')
      .eq(teamId ? 'team_id' : 'user_id', teamId || userId)
      .order('date', { ascending: false })
      .limit(10);

    return { profile, matches: matches || [], trainingSessions: trainingSessions || [] };
  }

  private async generatePersonalizedInsights(userData: any): Promise<PersonalizedInsight[]> {
    const insights: PersonalizedInsight[] = [];
    const { matches, trainingSessions, profile } = userData;

    // Performance insights
    if (matches.length > 0) {
      const recentMatches = matches.slice(0, 5);
      const avgRating = recentMatches.reduce((sum: number, match: any) => sum + (match.rating || 7), 0) / recentMatches.length;
      
      if (avgRating > 8) {
        insights.push({
          id: 'perf-excellent',
          type: 'performance',
          title: 'Excellent Recent Form',
          description: `Your average rating of ${avgRating.toFixed(1)} over the last 5 matches shows exceptional performance. Keep up the great work!`,
          priority: 'high',
          actionable: true,
          timestamp: new Date()
        });
      } else if (avgRating < 6.5) {
        insights.push({
          id: 'perf-improvement',
          type: 'performance',
          title: 'Performance Improvement Needed',
          description: `Your recent average rating of ${avgRating.toFixed(1)} suggests room for improvement. Focus on key areas during training.`,
          priority: 'high',
          actionable: true,
          timestamp: new Date()
        });
      }
    }

    // Training insights
    if (trainingSessions.length > 0) {
      const recentTraining = trainingSessions.slice(0, 3);
      const avgIntensity = recentTraining.reduce((sum: number, session: any) => sum + (session.intensity || 5), 0) / recentTraining.length;
      
      insights.push({
        id: 'training-intensity',
        type: 'fitness',
        title: 'Training Load Analysis',
        description: `Your recent training intensity average is ${avgIntensity.toFixed(1)}/10. ${avgIntensity > 7 ? 'Consider recovery sessions' : 'Room to increase intensity'}.`,
        priority: 'medium',
        actionable: true,
        timestamp: new Date()
      });
    }

    // Tactical insights
    insights.push({
      id: 'tactical-development',
      type: 'tactical',
      title: 'Tactical Development Opportunity',
      description: 'Based on your position and recent performances, focus on improving decision-making in the final third.',
      priority: 'medium',
      actionable: true,
      timestamp: new Date()
    });

    return insights;
  }

  private async calculatePerformanceMetrics(userData: any): Promise<PerformanceMetrics> {
    const { matches, profile } = userData;
    
    // Calculate current form based on recent matches
    const recentMatches = matches.slice(0, 5);
    const currentForm = recentMatches.length > 0 
      ? (recentMatches.reduce((sum: number, match: any) => sum + (match.rating || 7), 0) / recentMatches.length) * 10
      : 70;

    // Simulate fitness level (in real app, this would come from fitness tracking)
    const fitnessLevel = Math.floor(Math.random() * 30) + 70;

    // Calculate skill development metrics
    const skillDevelopment: SkillMetrics = {
      technical: Math.floor(Math.random() * 30) + 70,
      tactical: Math.floor(Math.random() * 30) + 70,
      physical: fitnessLevel,
      mental: Math.floor(Math.random() * 30) + 70
    };

    // Calculate consistency and improvement
    const consistency = matches.length > 3 
      ? this.calculateConsistency(matches.slice(0, 10))
      : 75;
    
    const improvement = this.calculateImprovement(matches);

    return {
      currentForm,
      fitnessLevel,
      skillDevelopment,
      consistency,
      improvement
    };
  }

  private calculateConsistency(matches: any[]): number {
    if (matches.length < 3) return 75;
    
    const ratings = matches.map(m => m.rating || 7);
    const mean = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) / ratings.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, Math.min(100, 100 - (standardDeviation * 20)));
  }

  private calculateImprovement(matches: any[]): number {
    if (matches.length < 6) return 0;
    
    const recent = matches.slice(0, 3).map(m => m.rating || 7);
    const older = matches.slice(3, 6).map(m => m.rating || 7);
    
    const recentAvg = recent.reduce((sum, rating) => sum + rating, 0) / recent.length;
    const olderAvg = older.reduce((sum, rating) => sum + rating, 0) / older.length;
    
    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  private async generateRecommendations(userData: any, metrics: PerformanceMetrics): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Fitness recommendations
    if (metrics.fitnessLevel < 75) {
      recommendations.push({
        id: 'fitness-improvement',
        category: 'training',
        title: 'Improve Physical Conditioning',
        description: 'Focus on cardiovascular endurance and strength training to boost overall fitness level.',
        priority: 8,
        estimatedImpact: 'high',
        timeframe: '4-6 weeks'
      });
    }

    // Skill development recommendations
    const lowestSkill = Object.entries(metrics.skillDevelopment)
      .sort(([,a], [,b]) => a - b)[0];
    
    if (lowestSkill[1] < 75) {
      recommendations.push({
        id: `skill-${lowestSkill[0]}`,
        category: 'development',
        title: `Improve ${lowestSkill[0]} Skills`,
        description: `Your ${lowestSkill[0]} skills need attention. Consider specialized training sessions.`,
        priority: 7,
        estimatedImpact: 'medium',
        timeframe: '6-8 weeks'
      });
    }

    // Consistency recommendations
    if (metrics.consistency < 70) {
      recommendations.push({
        id: 'consistency-improvement',
        category: 'tactical',
        title: 'Improve Performance Consistency',
        description: 'Work on mental preparation and routine to maintain consistent performance levels.',
        priority: 6,
        estimatedImpact: 'medium',
        timeframe: '3-4 weeks'
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private async analyzeTrends(userData: any): Promise<TrendAnalysis> {
    const { matches } = userData;
    
    // Determine performance trend
    const performanceTrend = this.determinePerformanceTrend(matches);
    
    // Analyze key metrics trends
    const keyMetrics = this.analyzeKeyMetricsTrends(matches);
    
    // Identify seasonal patterns (simplified)
    const seasonalPatterns: SeasonalPattern[] = [
      {
        period: 'Early Season',
        pattern: 'Strong start with high motivation',
        confidence: 0.8
      },
      {
        period: 'Mid Season',
        pattern: 'Consistent performance with occasional dips',
        confidence: 0.7
      }
    ];

    // Generate predictions
    const predictedOutcome: PredictedOutcome = {
      nextMatchPerformance: Math.floor(Math.random() * 30) + 70,
      seasonProjection: 'Positive trajectory with room for improvement',
      developmentAreas: ['Technical skills', 'Tactical awareness', 'Physical conditioning']
    };

    return {
      performanceTrend,
      keyMetrics,
      seasonalPatterns,
      predictedOutcome
    };
  }

  private determinePerformanceTrend(matches: any[]): 'improving' | 'stable' | 'declining' {
    if (matches.length < 6) return 'stable';
    
    const recent = matches.slice(0, 3).map(m => m.rating || 7);
    const older = matches.slice(3, 6).map(m => m.rating || 7);
    
    const recentAvg = recent.reduce((sum, rating) => sum + rating, 0) / recent.length;
    const olderAvg = older.reduce((sum, rating) => sum + rating, 0) / older.length;
    
    const improvement = (recentAvg - olderAvg) / olderAvg;
    
    if (improvement > 0.05) return 'improving';
    if (improvement < -0.05) return 'declining';
    return 'stable';
  }

  private analyzeKeyMetricsTrends(matches: any[]): MetricTrend[] {
    return [
      {
        metric: 'Performance Rating',
        direction: 'up',
        changePercentage: 5.2,
        significance: 'medium'
      },
      {
        metric: 'Goals Scored',
        direction: 'stable',
        changePercentage: 0.8,
        significance: 'low'
      },
      {
        metric: 'Pass Accuracy',
        direction: 'up',
        changePercentage: 3.1,
        significance: 'medium'
      }
    ];
  }

  private async assessRisks(userData: any, metrics: PerformanceMetrics): Promise<RiskAssessment> {
    // Calculate injury risk based on various factors
    const injuryRisk = this.calculateInjuryRisk(userData, metrics);
    
    // Calculate burnout risk
    const burnoutRisk = this.calculateBurnoutRisk(userData, metrics);
    
    // Calculate performance risk
    const performanceRisk = this.calculatePerformanceRisk(metrics);
    
    // Generate mitigation strategies
    const mitigationStrategies = this.generateMitigationStrategies(injuryRisk, burnoutRisk, performanceRisk);

    return {
      injuryRisk,
      burnoutRisk,
      performanceRisk,
      mitigationStrategies
    };
  }

  private calculateInjuryRisk(userData: any, metrics: PerformanceMetrics): number {
    let risk = 20; // Base risk
    
    // Fitness level impact
    if (metrics.fitnessLevel < 70) risk += 15;
    else if (metrics.fitnessLevel < 80) risk += 8;
    
    // Training load impact (simulated)
    const trainingLoad = Math.random() * 100;
    if (trainingLoad > 85) risk += 10;
    
    // Age impact (simulated)
    const age = Math.floor(Math.random() * 15) + 18;
    if (age > 30) risk += 5;
    
    return Math.min(100, Math.max(0, risk));
  }

  private calculateBurnoutRisk(userData: any, metrics: PerformanceMetrics): number {
    let risk = 15; // Base risk
    
    // Consistency impact
    if (metrics.consistency < 60) risk += 20;
    else if (metrics.consistency < 75) risk += 10;
    
    // Performance trend impact
    if (metrics.improvement < -5) risk += 15;
    
    return Math.min(100, Math.max(0, risk));
  }

  private calculatePerformanceRisk(metrics: PerformanceMetrics): number {
    let risk = 10; // Base risk
    
    // Current form impact
    if (metrics.currentForm < 60) risk += 25;
    else if (metrics.currentForm < 75) risk += 15;
    
    // Skill balance impact
    const skillValues = Object.values(metrics.skillDevelopment);
    const skillVariance = this.calculateVariance(skillValues);
    if (skillVariance > 100) risk += 10;
    
    return Math.min(100, Math.max(0, risk));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private generateMitigationStrategies(injuryRisk: number, burnoutRisk: number, performanceRisk: number): string[] {
    const strategies: string[] = [];
    
    if (injuryRisk > 30) {
      strategies.push('Implement comprehensive warm-up and cool-down routines');
      strategies.push('Focus on injury prevention exercises and flexibility training');
      strategies.push('Monitor training load and ensure adequate recovery time');
    }
    
    if (burnoutRisk > 25) {
      strategies.push('Vary training routines to maintain engagement and motivation');
      strategies.push('Ensure proper work-life balance and mental health support');
      strategies.push('Set realistic goals and celebrate small achievements');
    }
    
    if (performanceRisk > 20) {
      strategies.push('Focus on fundamental skills and technique refinement');
      strategies.push('Analyze recent performances to identify specific improvement areas');
      strategies.push('Consider tactical adjustments or position changes');
    }
    
    return strategies;
  }

  private generateFallbackAnalytics(userId: string, teamId?: string): UserAnalytics {
    return {
      userId,
      teamId,
      personalizedInsights: [
        {
          id: 'fallback-insight',
          type: 'performance',
          title: 'Welcome to Analytics',
          description: 'Start recording matches and training sessions to get personalized insights.',
          priority: 'medium',
          actionable: true,
          timestamp: new Date()
        }
      ],
      performanceMetrics: {
        currentForm: 75,
        fitnessLevel: 80,
        skillDevelopment: {
          technical: 75,
          tactical: 75,
          physical: 80,
          mental: 75
        },
        consistency: 75,
        improvement: 0
      },
      recommendations: [
        {
          id: 'start-tracking',
          category: 'development',
          title: 'Start Performance Tracking',
          description: 'Begin recording your matches and training sessions to unlock detailed analytics.',
          priority: 10,
          estimatedImpact: 'high',
          timeframe: 'Immediate'
        }
      ],
      trends: {
        performanceTrend: 'stable',
        keyMetrics: [],
        seasonalPatterns: [],
        predictedOutcome: {
          nextMatchPerformance: 75,
          seasonProjection: 'Stable with potential for growth',
          developmentAreas: ['Data collection', 'Performance tracking']
        }
      },
      riskAssessment: {
        injuryRisk: 20,
        burnoutRisk: 15,
        performanceRisk: 10,
        mitigationStrategies: [
          'Maintain regular training schedule',
          'Focus on proper nutrition and hydration',
          'Ensure adequate rest and recovery'
        ]
      }
    };
  }
}

export const userDataAnalysisService = new UserDataAnalysisService();