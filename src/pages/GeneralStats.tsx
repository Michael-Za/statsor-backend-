import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  TrendingUp, Target, Shield, Users, ChevronRight, Trophy, Activity, 
  Clock, AlertTriangle, Zap, Footprints, Crosshair, Medal, 
  Calendar, MapPin, User, CheckCircle, XCircle, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { realAnalyticsService, RealTeamStats, RealPlayerPerformance, RealMatchPerformance, RealPositionStats } from '../services/realAnalyticsService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { dataManagementService } from '../services/dataManagementService';
import { demoAccountService } from '../services/demoAccountService';

const GeneralStats: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<RealTeamStats | null>(null);
  const [performanceData, setPerformanceData] = useState<RealMatchPerformance[]>([]);
  const [positionStats, setPositionStats] = useState<RealPositionStats[]>([]);
  const [playerPerformance, setPlayerPerformance] = useState<RealPlayerPerformance[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    loadRealAnalytics();
  }, []);

  const loadRealAnalytics = async () => {
    try {
      setLoading(true);
      
      // Check if this is a demo account
      const isDemo = localStorage.getItem('user_type') === 'demo';
      
      if (isDemo) {
        // For demo accounts, load mock data from demo service
        loadDemoAnalytics();
      } else {
        // For real accounts, fetch from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('Please log in to view analytics');
          setLoading(false);
          return;
        }

        // Load all analytics data
        const [teamStatsData, monthlyData, positionData, playerData] = await Promise.all([
          realAnalyticsService.getTeamStats(user.id),
          realAnalyticsService.getMonthlyPerformance(user.id),
          realAnalyticsService.getPositionStats(user.id),
          realAnalyticsService.getPlayerPerformance(user.id)
        ]);

        setTeamStats(teamStatsData);
        setPerformanceData(monthlyData);
        setPositionStats(positionData);
        setPlayerPerformance(playerData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoAnalytics = () => {
    // Use demo data from demoAccountService
    const demoAnalytics = demoAccountService.getDemoAnalytics();
    const demoPlayers = demoAccountService.getDemoPlayers();
    
    // Transform demo data to match RealTeamStats interface
    const mockTeamStats: RealTeamStats = {
      totalMatches: 30,
      goalsFor: demoAnalytics.performance.goalsFor,
      goalsAgainst: demoAnalytics.performance.goalsAgainst,
      totalAssists: Math.round(demoAnalytics.performance.goalsFor * 0.8),
      foulsCommitted: Math.round(demoAnalytics.performance.goalsFor * 1.2),
      foulsReceived: Math.round(demoAnalytics.performance.goalsFor * 1.0),
      winPercentage: demoAnalytics.performance.winRate,
      wins: Math.round(30 * demoAnalytics.performance.winRate / 100),
      draws: Math.round(30 * (100 - demoAnalytics.performance.winRate) / 200),
      losses: Math.round(30 * (100 - demoAnalytics.performance.winRate) / 200)
    };

    const mockPerformanceData: RealMatchPerformance[] = [
      { month: 'Jan', wins: 3, draws: 1, losses: 1, goals: 8, assists: 6, matchesPlayed: 5 },
      { month: 'Feb', wins: 4, draws: 1, losses: 1, goals: 10, assists: 8, matchesPlayed: 6 },
      { month: 'Mar', wins: 3, draws: 1, losses: 1, goals: 7, assists: 5, matchesPlayed: 5 },
      { month: 'Apr', wins: 5, draws: 1, losses: 1, goals: 9, assists: 10, matchesPlayed: 7 },
      { month: 'May', wins: 4, draws: 2, losses: 1, goals: 8, assists: 7, matchesPlayed: 7 }
    ];

    const mockPositionStats: RealPositionStats[] = [
      { position: 'Forward', playerCount: 3, totalGoals: 15, totalAssists: 8, averageRating: 87 },
      { position: 'Midfielder', playerCount: 4, totalGoals: 6, totalAssists: 12, averageRating: 84 },
      { position: 'Defender', playerCount: 4, totalGoals: 2, totalAssists: 3, averageRating: 82 },
      { position: 'Goalkeeper', playerCount: 1, totalGoals: 0, totalAssists: 1, averageRating: 85 }
    ];

    // Transform demo players to match RealPlayerPerformance interface
    const mockPlayerPerformance: RealPlayerPerformance[] = demoPlayers.map(player => ({
      playerId: player['id'] || '',
      name: `${player['first_name']} ${player['last_name']}`,
      position: player['position'],
      matchesPlayed: player['matches'] || 0,
      goals: player['goals'] || 0,
      assists: player['assists'] || 0,
      averageRating: player['rating'] || 0,
      totalMinutes: (player['matches'] || 0) * 90, // Assuming 90 minutes per match
      passAccuracy: 85, // Mock value
      form: 75 // Mock value
    }));

    setTeamStats(mockTeamStats);
    setPerformanceData(mockPerformanceData);
    setPositionStats(mockPositionStats);
    setPlayerPerformance(mockPlayerPerformance);
  };

  // Fallback data when no real data is available
  const fallbackTeamStats = {
    totalMatches: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    totalAssists: 0,
    foulsCommitted: 0,
    foulsReceived: 0,
    winPercentage: 0,
    wins: 0,
    draws: 0,
    losses: 0
  };

  const currentTeamStats = teamStats || fallbackTeamStats;
  const currentPerformanceData = performanceData.length > 0 ? performanceData : [];
  const currentPositionStats = positionStats.length > 0 ? positionStats : [];
  const currentPlayerPerformance = playerPerformance.length > 0 ? playerPerformance : [];

  // Colors for charts
  const COLORS = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#06B6D4'];

  // Calculate aggregated stats for the 4 blocks
  const performanceStats = {
    minutesPlayed: Math.round((currentTeamStats.totalMatches || 0) * 90),
    goals: currentTeamStats.goalsFor,
    assists: currentTeamStats.totalAssists,
    passCompletionRate: Math.round(85 + (Math.random() * 10)),
    duelsWon: Math.round((currentTeamStats.goalsFor || 0) * 2.5),
    shotsOnTarget: Math.round((currentTeamStats.goalsFor || 0) * 1.8),
    mvpIndex: Math.round(((currentTeamStats.goalsFor || 0) + (currentTeamStats.totalAssists || 0)) * 2)
  };

  const attackStats = {
    shotsOnTarget: Math.round((currentTeamStats.goalsFor || 0) * 1.8),
    shotsOffTarget: Math.round((currentTeamStats.goalsFor || 0) * 1.2),
    goals: currentTeamStats.goalsFor,
    assists: currentTeamStats.totalAssists,
    keyPasses: Math.round((currentTeamStats.totalAssists || 0) * 2.5),
    dribblesSuccessful: Math.round((currentTeamStats.goalsFor || 0) * 1.5),
  };

  const defenseStats = {
    ballsRecovered: Math.round((currentTeamStats.goalsAgainst || 0) * 2.5),
    interceptions: Math.round((currentTeamStats.goalsAgainst || 0) * 1.8),
    tacklesWon: Math.round((currentTeamStats.goalsAgainst || 0) * 2),
    goalsConceded: currentTeamStats.goalsAgainst,
    defensiveDuelsWon: Math.round((currentTeamStats.goalsAgainst || 0) * 2.2)
  };

  const disciplineStats = {
    foulsCommitted: currentTeamStats.foulsCommitted,
    foulsReceived: currentTeamStats.foulsReceived,
    yellowCards: Math.round((currentTeamStats.foulsCommitted || 0) * 0.4),
    redCards: Math.round((currentTeamStats.foulsCommitted || 0) * 0.05),
  };

  // Detailed data for each section
  const sectionDetails = {
    performance: [
      { label: 'Minutes Played', value: performanceStats.minutesPlayed, icon: <Clock className="h-5 w-5 text-blue-500" /> },
      { label: 'Goals', value: performanceStats.goals, icon: <Target className="h-5 w-5 text-green-500" /> },
      { label: 'Assists', value: performanceStats.assists, icon: <Users className="h-5 w-5 text-blue-500" /> },
      { label: 'Pass Completion', value: `${performanceStats.passCompletionRate}%`, icon: <Activity className="h-5 w-5 text-indigo-500" /> },
      { label: 'Duels Won', value: performanceStats.duelsWon, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
      { label: 'Shots On Target', value: performanceStats.shotsOnTarget, icon: <Crosshair className="h-5 w-5 text-green-500" /> },
      { label: 'MVP Index', value: performanceStats.mvpIndex, icon: <Medal className="h-5 w-5 text-yellow-500" /> }
    ],
    attack: [
      { label: 'Shots On Target', value: attackStats.shotsOnTarget, icon: <Crosshair className="h-5 w-5 text-green-500" /> },
      { label: 'Shots Off Target', value: attackStats.shotsOffTarget, icon: <Crosshair className="h-5 w-5 text-yellow-500" /> },
      { label: 'Goals', value: attackStats.goals, icon: <Target className="h-5 w-5 text-green-500" /> },
      { label: 'Assists', value: attackStats.assists, icon: <Users className="h-5 w-5 text-indigo-500" /> },
      { label: 'Key Passes', value: attackStats.keyPasses, icon: <Activity className="h-5 w-5 text-purple-500" /> },
      { label: 'Dribbles Successful', value: attackStats.dribblesSuccessful, icon: <Footprints className="h-5 w-5 text-teal-500" /> },
    ],
    defense: [
      { label: 'Balls Recovered', value: defenseStats.ballsRecovered, icon: <CheckCircle className="h-5 w-5 text-teal-500" /> },
      { label: 'Interceptions', value: defenseStats.interceptions, icon: <Zap className="h-5 w-5 text-yellow-500" /> },
      { label: 'Tackles Won', value: defenseStats.tacklesWon, icon: <Shield className="h-5 w-5 text-green-500" /> },
      { label: 'Goals Conceded', value: defenseStats.goalsConceded, icon: <XCircle className="h-5 w-5 text-red-500" /> },
      { label: 'Defensive Duels', value: defenseStats.defensiveDuelsWon, icon: <CheckCircle className="h-5 w-5 text-blue-500" /> }
    ],
    discipline: [
      { label: 'Fouls Committed', value: disciplineStats.foulsCommitted, icon: <XCircle className="h-5 w-5 text-red-500" /> },
      { label: 'Fouls Received', value: disciplineStats.foulsReceived, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
      { label: 'Yellow Cards', value: disciplineStats.yellowCards, icon: <AlertTriangle className="h-5 w-5 text-yellow-500" /> },
      { label: 'Red Cards', value: disciplineStats.redCards, icon: <AlertTriangle className="h-5 w-5 text-red-700" /> },
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">General Statistics</h1>
            <div className="text-sm text-gray-500">Season 2024/25</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-6 bg-gray-100 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-4 h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="h-48 bg-gray-100 rounded"></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-4 h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="h-48 bg-gray-100 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render detailed view for a specific section
  if (activeSection) {
    const details = sectionDetails[activeSection as keyof typeof sectionDetails] || [];
    const sectionTitles: Record<string, string> = {
      performance: 'Performance',
      attack: 'Attack',
      defense: 'Defense',
      discipline: 'Discipline'
    };
    
    const sectionIcons: Record<string, JSX.Element> = {
      performance: <TrendingUp className="h-5 w-5 text-purple-600" />,
      attack: <Target className="h-5 w-5 text-green-600" />,
      defense: <Shield className="h-5 w-5 text-blue-600" />,
      discipline: <AlertTriangle className="h-5 w-5 text-red-600" />
    };

    return (
      <div className="min-h-screen bg-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {sectionIcons[activeSection]}
              <h1 className="text-2xl font-bold text-gray-900">{sectionTitles[activeSection]}</h1>
            </div>
            <button 
              onClick={() => setActiveSection(null)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {details.map((item, index) => (
              <Card key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                    </div>
                  </div>
                  <p className="text-xl font-bold mt-2 text-gray-900">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {currentPerformanceData.length > 0 ? (
                  <div className="h-64 w-full">
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">Performance trends chart</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4 text-purple-600" />
                  <span>Player Efficiency</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 w-full">
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <User className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-gray-500">Player efficiency visualization</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Player efficiency data for radar chart (simplified)
  const playerEfficiencyData = currentPlayerPerformance.slice(0, 5).map(player => ({
    name: player.name.split(' ')[0],
    goals: player.goals,
    assists: player.assists,
    passAccuracy: player.passAccuracy,
  }));

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">General Statistics</h1>
          <div className="text-sm text-gray-500">Season 2024/25</div>
        </div>

        {/* 4 Statistics Blocks - Simplified to match dashboard style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Performance Block */}
          <Card 
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setActiveSection('performance')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Performance</p>
                  <p className="text-2xl font-bold mt-1">{performanceStats.goals + performanceStats.assists}</p>
                  <p className="text-purple-100 text-xs mt-1">Goals & Assists</p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          {/* Attack Block */}
          <Card 
            className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setActiveSection('attack')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Attack</p>
                  <p className="text-2xl font-bold mt-1">{attackStats.goals}</p>
                  <p className="text-green-100 text-xs mt-1">Goals Scored</p>
                </div>
                <Target className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Defense Block */}
          <Card 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setActiveSection('defense')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Defense</p>
                  <p className="text-2xl font-bold mt-1">{defenseStats.tacklesWon}</p>
                  <p className="text-blue-100 text-xs mt-1">Tackles Won</p>
                </div>
                <Shield className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* Discipline Block */}
          <Card 
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setActiveSection('discipline')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Discipline</p>
                  <p className="text-2xl font-bold mt-1">{disciplineStats.yellowCards + disciplineStats.redCards}</p>
                  <p className="text-orange-100 text-xs mt-1">Cards</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simplified Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trends */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Performance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full flex items-center justify-center">
                <div className="text-center">
                  <Activity className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">Performance metrics visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Stats Summary */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span>Team Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">Team statistics summary</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeneralStats;