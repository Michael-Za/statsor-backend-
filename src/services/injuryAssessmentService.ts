import { mlService } from '../utils/ml';

export interface InjuryAssessment {
  playerId: string;
  playerName: string;
  overallRisk: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    workload: number;
    fatigue: number;
    historical: number;
    biomechanical: number;
    age: number;
    position: number;
  };
  specificRisks: {
    muscular: number;
    joint: number;
    ligament: number;
    overuse: number;
  };
  recommendations: Recommendation[];
  recoveryPlan?: RecoveryPlan;
  monitoringAlerts: Alert[];
  nextAssessment: Date;
}

export interface Recommendation {
  id: string;
  type: 'prevention' | 'treatment' | 'modification' | 'rest';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  duration: string;
  frequency: string;
  expectedOutcome: string;
  category: 'training' | 'recovery' | 'medical' | 'nutrition' | 'lifestyle';
}

export interface RecoveryPlan {
  injuryType: string;
  severity: 'minor' | 'moderate' | 'severe';
  estimatedRecoveryTime: number; // days
  phases: RecoveryPhase[];
  milestones: Milestone[];
  restrictions: string[];
  clearanceRequirements: string[];
}

export interface RecoveryPhase {
  phase: number;
  name: string;
  duration: number; // days
  goals: string[];
  activities: string[];
  restrictions: string[];
  progressMarkers: string[];
}

export interface Milestone {
  day: number;
  description: string;
  assessmentRequired: boolean;
  clearanceCriteria: string[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  action: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface PlayerHealthData {
  playerId: string;
  age: number;
  position: string;
  minutesPlayed: number;
  trainingLoad: number[];
  matchLoad: number[];
  injuryHistory: InjuryRecord[];
  physicalMetrics: PhysicalMetrics;
  wellnessData: WellnessData;
  biomechanicalData?: BiomechanicalData;
}

export interface InjuryRecord {
  id: string;
  type: string;
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'severe';
  date: Date;
  daysOut: number;
  cause: string;
  treatment: string;
  recurrence: boolean;
}

export interface PhysicalMetrics {
  sprintSpeed: number;
  acceleration: number;
  workload: number;
  fatigueLevel: number;
  muscleStrain: number;
  flexibility: number;
  strength: number;
  endurance: number;
}

export interface WellnessData {
  sleepQuality: number; // 1-10
  stressLevel: number; // 1-10
  soreness: number; // 1-10
  energy: number; // 1-10
  mood: number; // 1-10
  hydration: number; // 1-10
  nutrition: number; // 1-10
}

export interface BiomechanicalData {
  runningGait: {
    cadence: number;
    strideLength: number;
    groundContactTime: number;
    verticalOscillation: number;
  };
  jumpMechanics: {
    takeoffAngle: number;
    landingForce: number;
    asymmetry: number;
  };
  movementQuality: {
    stability: number;
    mobility: number;
    coordination: number;
  };
}

class InjuryAssessmentService {
  private riskThresholds = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 90
  };

  private positionRiskFactors = {
    'GK': 0.8,
    'CB': 1.1,
    'LB': 1.3,
    'RB': 1.3,
    'CDM': 1.2,
    'CM': 1.4,
    'CAM': 1.3,
    'LM': 1.5,
    'RM': 1.5,
    'LW': 1.6,
    'RW': 1.6,
    'ST': 1.4,
    'CF': 1.4
  };

  async assessPlayer(playerData: PlayerHealthData): Promise<InjuryAssessment> {
    try {
      // Calculate individual risk factors
      const riskFactors = await this.calculateRiskFactors(playerData);
      
      // Calculate overall risk score
      const overallRisk = this.calculateOverallRisk(riskFactors);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallRisk);
      
      // Calculate specific injury risks
      const specificRisks = this.calculateSpecificRisks(playerData, riskFactors);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(playerData, riskFactors, riskLevel);
      
      // Generate monitoring alerts
      const monitoringAlerts = this.generateMonitoringAlerts(riskLevel, riskFactors);
      
      // Create recovery plan if injured
      const recoveryPlan = playerData.injuryHistory.some(injury => 
        (Date.now() - injury.date.getTime()) < (30 * 24 * 60 * 60 * 1000)
      ) ? await this.createRecoveryPlan(playerData) : undefined;
      
      return {
        playerId: playerData.playerId,
        playerName: `Player ${playerData.playerId}`,
        overallRisk,
        riskLevel,
        riskFactors,
        specificRisks,
        recommendations,
        recoveryPlan,
        monitoringAlerts,
        nextAssessment: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // Next week
      };
    } catch (error) {
      console.error('Error in injury assessment:', error);
      return this.generateFallbackAssessment(playerData.playerId);
    }
  }

  private async calculateRiskFactors(playerData: PlayerHealthData): Promise<InjuryAssessment['riskFactors']> {
    const workloadRisk = this.calculateWorkloadRisk(playerData);
    const fatigueRisk = this.calculateFatigueRisk(playerData);
    const historicalRisk = this.calculateHistoricalRisk(playerData);
    const biomechanicalRisk = this.calculateBiomechanicalRisk(playerData);
    const ageRisk = this.calculateAgeRisk(playerData.age);
    const positionRisk = this.calculatePositionRisk(playerData.position);

    return {
      workload: workloadRisk,
      fatigue: fatigueRisk,
      historical: historicalRisk,
      biomechanical: biomechanicalRisk,
      age: ageRisk,
      position: positionRisk
    };
  }

  private calculateWorkloadRisk(playerData: PlayerHealthData): number {
    const recentLoad = playerData.trainingLoad.slice(-7).reduce((a, b) => a + b, 0);
    const avgLoad = playerData.trainingLoad.reduce((a, b) => a + b, 0) / playerData.trainingLoad.length;
    const loadRatio = recentLoad / (avgLoad * 7);
    
    if (loadRatio > 1.5) return Math.min(90, 30 + (loadRatio - 1.5) * 40);
    if (loadRatio < 0.7) return 20 + (0.7 - loadRatio) * 30;
    return 10 + Math.abs(loadRatio - 1.0) * 20;
  }

  private calculateFatigueRisk(playerData: PlayerHealthData): number {
    const { fatigueLevel, muscleStrain } = playerData.physicalMetrics;
    const { sleepQuality, stressLevel, soreness, energy } = playerData.wellnessData;
    
    const fatigueScore = (
      fatigueLevel * 0.3 +
      muscleStrain * 0.2 +
      (10 - sleepQuality) * 0.2 +
      stressLevel * 0.15 +
      soreness * 0.1 +
      (10 - energy) * 0.05
    );
    
    return Math.min(100, fatigueScore * 10);
  }

  private calculateHistoricalRisk(playerData: PlayerHealthData): number {
    const recentInjuries = playerData.injuryHistory.filter(
      injury => (Date.now() - injury.date.getTime()) < (365 * 24 * 60 * 60 * 1000)
    );
    
    let risk = recentInjuries.length * 15;
    
    // Add severity weighting
    recentInjuries.forEach(injury => {
      if (injury.severity === 'severe') risk += 10;
      else if (injury.severity === 'moderate') risk += 5;
      if (injury.recurrence) risk += 15;
    });
    
    return Math.min(100, risk);
  }

  private calculateBiomechanicalRisk(playerData: PlayerHealthData): number {
    if (!playerData.biomechanicalData) return 20; // Default moderate risk
    
    const { runningGait, jumpMechanics, movementQuality } = playerData.biomechanicalData;
    
    let risk = 0;
    
    // Gait analysis
    if (runningGait.groundContactTime > 250) risk += 10;
    if (runningGait.verticalOscillation > 10) risk += 8;
    
    // Jump mechanics
    if (jumpMechanics.asymmetry > 15) risk += 15;
    if (jumpMechanics.landingForce > 3.0) risk += 10;
    
    // Movement quality
    if (movementQuality.stability < 70) risk += 12;
    if (movementQuality.mobility < 70) risk += 8;
    
    return Math.min(100, risk);
  }

  private calculateAgeRisk(age: number): number {
    if (age < 20) return 15; // Young player development risk
    if (age < 25) return 5;
    if (age < 30) return 10;
    if (age < 35) return 25;
    return 40; // Veteran player risk
  }

  private calculatePositionRisk(position: string): number {
    const baseFactor = this.positionRiskFactors[position as keyof typeof this.positionRiskFactors] || 1.0;
    return Math.min(100, baseFactor * 20);
  }

  private calculateOverallRisk(riskFactors: InjuryAssessment['riskFactors']): number {
    const weights = {
      workload: 0.25,
      fatigue: 0.20,
      historical: 0.20,
      biomechanical: 0.15,
      age: 0.10,
      position: 0.10
    };
    
    return Object.entries(riskFactors).reduce((total, [factor, value]) => {
      return total + (value * weights[factor as keyof typeof weights]);
    }, 0);
  }

  private determineRiskLevel(overallRisk: number): InjuryAssessment['riskLevel'] {
    if (overallRisk >= this.riskThresholds.critical) return 'critical';
    if (overallRisk >= this.riskThresholds.high) return 'high';
    if (overallRisk >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  private calculateSpecificRisks(playerData: PlayerHealthData, riskFactors: InjuryAssessment['riskFactors']): InjuryAssessment['specificRisks'] {
    const baseRisk = (riskFactors.workload + riskFactors.fatigue) / 2;
    
    return {
      muscular: Math.min(100, baseRisk + riskFactors.fatigue * 0.3),
      joint: Math.min(100, baseRisk + riskFactors.age * 0.4),
      ligament: Math.min(100, baseRisk + riskFactors.biomechanical * 0.5),
      overuse: Math.min(100, riskFactors.workload + riskFactors.historical * 0.3)
    };
  }

  private async generateRecommendations(playerData: PlayerHealthData, riskFactors: InjuryAssessment['riskFactors'], riskLevel: InjuryAssessment['riskLevel']): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Workload management
    if (riskFactors.workload > 50) {
      recommendations.push({
        id: 'workload-1',
        type: 'modification',
        priority: riskLevel === 'critical' ? 'urgent' : 'high',
        title: 'Reduce Training Load',
        description: 'Decrease training intensity by 20-30% for the next week to allow recovery.',
        duration: '7-10 days',
        frequency: 'Immediate',
        expectedOutcome: 'Reduced fatigue and injury risk',
        category: 'training'
      });
    }
    
    // Fatigue management
    if (riskFactors.fatigue > 60) {
      recommendations.push({
        id: 'fatigue-1',
        type: 'treatment',
        priority: 'high',
        title: 'Enhanced Recovery Protocol',
        description: 'Implement additional recovery methods including massage, ice baths, and extended sleep.',
        duration: '2 weeks',
        frequency: 'Daily',
        expectedOutcome: 'Improved recovery and reduced fatigue',
        category: 'recovery'
      });
    }
    
    // Historical injury prevention
    if (riskFactors.historical > 40) {
      recommendations.push({
        id: 'historical-1',
        type: 'prevention',
        priority: 'medium',
        title: 'Targeted Injury Prevention',
        description: 'Focus on strengthening exercises for previously injured areas.',
        duration: '4-6 weeks',
        frequency: '3x per week',
        expectedOutcome: 'Reduced re-injury risk',
        category: 'training'
      });
    }
    
    // Biomechanical improvements
    if (riskFactors.biomechanical > 50) {
      recommendations.push({
        id: 'biomech-1',
        type: 'treatment',
        priority: 'medium',
        title: 'Movement Pattern Correction',
        description: 'Work with physiotherapist to address movement inefficiencies.',
        duration: '6-8 weeks',
        frequency: '2x per week',
        expectedOutcome: 'Improved movement quality and reduced injury risk',
        category: 'medical'
      });
    }
    
    // Nutrition and lifestyle
    if (playerData.wellnessData.nutrition < 7 || playerData.wellnessData.hydration < 7) {
      recommendations.push({
        id: 'nutrition-1',
        type: 'prevention',
        priority: 'medium',
        title: 'Optimize Nutrition and Hydration',
        description: 'Improve dietary habits and hydration strategies to support recovery.',
        duration: 'Ongoing',
        frequency: 'Daily',
        expectedOutcome: 'Better recovery and performance',
        category: 'nutrition'
      });
    }
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private generateMonitoringAlerts(riskLevel: InjuryAssessment['riskLevel'], riskFactors: InjuryAssessment['riskFactors']): Alert[] {
    const alerts: Alert[] = [];
    
    if (riskLevel === 'critical') {
      alerts.push({
        id: 'critical-1',
        type: 'critical',
        message: 'CRITICAL: Player at very high injury risk - immediate medical assessment required',
        action: 'Schedule immediate medical evaluation',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    if (riskFactors.workload > 80) {
      alerts.push({
        id: 'workload-alert',
        type: 'warning',
        message: 'High workload detected - consider load management',
        action: 'Reduce training intensity',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    if (riskFactors.fatigue > 70) {
      alerts.push({
        id: 'fatigue-alert',
        type: 'warning',
        message: 'Elevated fatigue levels - enhanced recovery needed',
        action: 'Implement recovery protocols',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    return alerts;
  }

  private async createRecoveryPlan(playerData: PlayerHealthData): Promise<RecoveryPlan> {
    const recentInjury = playerData.injuryHistory
      .filter(injury => (Date.now() - injury.date.getTime()) < (30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
    if (!recentInjury) {
      throw new Error('No recent injury found for recovery plan');
    }
    
    const phases = this.generateRecoveryPhases(recentInjury);
    const milestones = this.generateRecoveryMilestones(recentInjury);
    
    return {
      injuryType: recentInjury.type,
      severity: recentInjury.severity,
      estimatedRecoveryTime: this.estimateRecoveryTime(recentInjury),
      phases,
      milestones,
      restrictions: this.generateRestrictions(recentInjury),
      clearanceRequirements: this.generateClearanceRequirements(recentInjury)
    };
  }

  private generateRecoveryPhases(injury: InjuryRecord): RecoveryPhase[] {
    const basePhases: RecoveryPhase[] = [
      {
        phase: 1,
        name: 'Acute Phase',
        duration: 3,
        goals: ['Pain reduction', 'Inflammation control', 'Protection'],
        activities: ['Rest', 'Ice application', 'Gentle range of motion'],
        restrictions: ['No weight bearing', 'No sports activities'],
        progressMarkers: ['Reduced pain', 'Decreased swelling']
      },
      {
        phase: 2,
        name: 'Early Mobilization',
        duration: 7,
        goals: ['Restore range of motion', 'Begin strengthening'],
        activities: ['Physiotherapy', 'Gentle exercises', 'Pool therapy'],
        restrictions: ['Limited weight bearing', 'No running'],
        progressMarkers: ['Full range of motion', 'No pain with movement']
      },
      {
        phase: 3,
        name: 'Progressive Loading',
        duration: 14,
        goals: ['Build strength', 'Improve function'],
        activities: ['Strength training', 'Balance exercises', 'Light jogging'],
        restrictions: ['No contact activities', 'Limited intensity'],
        progressMarkers: ['80% strength return', 'No pain with activity']
      },
      {
        phase: 4,
        name: 'Return to Sport',
        duration: 7,
        goals: ['Sport-specific preparation', 'Full function'],
        activities: ['Sport drills', 'Contact practice', 'Match simulation'],
        restrictions: ['Gradual return to full contact'],
        progressMarkers: ['Full strength', 'Confidence in movement']
      }
    ];
    
    // Adjust phases based on injury severity
    if (injury.severity === 'severe') {
      basePhases.forEach(phase => {
        phase.duration = Math.ceil(phase.duration * 1.5);
      });
    } else if (injury.severity === 'minor') {
      basePhases.forEach(phase => {
        phase.duration = Math.ceil(phase.duration * 0.7);
      });
    }
    
    return basePhases;
  }

  private generateRecoveryMilestones(injury: InjuryRecord): Milestone[] {
    return [
      {
        day: 3,
        description: 'Pain assessment and initial evaluation',
        assessmentRequired: true,
        clearanceCriteria: ['Pain level < 3/10', 'No significant swelling']
      },
      {
        day: 10,
        description: 'Range of motion and strength assessment',
        assessmentRequired: true,
        clearanceCriteria: ['90% range of motion', 'No pain with movement']
      },
      {
        day: 21,
        description: 'Functional movement assessment',
        assessmentRequired: true,
        clearanceCriteria: ['Normal movement patterns', '80% strength']
      },
      {
        day: 28,
        description: 'Return to sport assessment',
        assessmentRequired: true,
        clearanceCriteria: ['Full strength', 'Sport-specific movements', 'Psychological readiness']
      }
    ];
  }

  private estimateRecoveryTime(injury: InjuryRecord): number {
    const baseTimes = {
      'minor': 7,
      'moderate': 21,
      'severe': 42
    };
    
    let baseTime = baseTimes[injury.severity];
    
    // Adjust for injury type
    if (injury.type.toLowerCase().includes('hamstring')) baseTime *= 1.2;
    if (injury.type.toLowerCase().includes('acl')) baseTime *= 3;
    if (injury.type.toLowerCase().includes('ankle')) baseTime *= 0.8;
    
    return Math.ceil(baseTime);
  }

  private generateRestrictions(injury: InjuryRecord): string[] {
    const baseRestrictions = [
      'No high-intensity training until cleared',
      'Avoid activities that cause pain',
      'Follow prescribed rehabilitation program'
    ];
    
    // Add injury-specific restrictions
    if (injury.bodyPart.toLowerCase().includes('knee')) {
      baseRestrictions.push('No pivoting or cutting movements');
    }
    
    if (injury.bodyPart.toLowerCase().includes('ankle')) {
      baseRestrictions.push('No jumping or landing activities');
    }
    
    return baseRestrictions;
  }

  private generateClearanceRequirements(injury: InjuryRecord): string[] {
    return [
      'Medical clearance from team physician',
      'Physiotherapy discharge',
      'Functional movement screen pass',
      'Psychological readiness assessment',
      'Gradual return to training protocol completion'
    ];
  }

  private generateFallbackAssessment(playerId: string): InjuryAssessment {
    return {
      playerId,
      playerName: `Player ${playerId}`,
      overallRisk: 25,
      riskLevel: 'medium',
      riskFactors: {
        workload: 20,
        fatigue: 25,
        historical: 15,
        biomechanical: 20,
        age: 15,
        position: 20
      },
      specificRisks: {
        muscular: 20,
        joint: 15,
        ligament: 18,
        overuse: 22
      },
      recommendations: [
        {
          id: 'fallback-1',
          type: 'prevention',
          priority: 'medium',
          title: 'General Injury Prevention',
          description: 'Maintain regular warm-up and cool-down routines.',
          duration: 'Ongoing',
          frequency: 'Daily',
          expectedOutcome: 'Reduced injury risk',
          category: 'training'
        }
      ],
      monitoringAlerts: [],
      nextAssessment: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
    };
  }

  async assessTeam(teamId: string): Promise<{
    teamId: string;
    overallRisk: number;
    riskDistribution: Record<InjuryAssessment['riskLevel'], number>;
    highRiskPlayers: string[];
    recommendations: Recommendation[];
    alerts: Alert[];
  }> {
    // This would typically fetch all team players and assess them
    // For now, return a mock team assessment
    return {
      teamId,
      overallRisk: 35,
      riskDistribution: {
        low: 60,
        medium: 25,
        high: 12,
        critical: 3
      },
      highRiskPlayers: ['player-1', 'player-3'],
      recommendations: [
        {
          id: 'team-1',
          type: 'prevention',
          priority: 'high',
          title: 'Team Load Management',
          description: 'Implement rotation policy to manage player workloads.',
          duration: '2 weeks',
          frequency: 'Ongoing',
          expectedOutcome: 'Reduced team injury risk',
          category: 'training'
        }
      ],
      alerts: []
    };
  }
}

export const injuryAssessmentService = new InjuryAssessmentService();
export default injuryAssessmentService;