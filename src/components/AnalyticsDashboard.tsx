import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, BarChart3, PieChart, TrendingUp, Users, Calendar, 
  Download, Plus, Trophy, Shield, X, Trash2, Target, Activity, 
  Search, RefreshCw, LineChart, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { realAnalyticsService } from '../services/realAnalyticsService';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

// Color palette for charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

// Chart type definitions
type ChartType = 'bar' | 'line' | 'pie';
type MetricType = 'goals' | 'assists' | 'accuracy' | 'minutes' | 'passes';
type TimeRange = 'season' | 'month' | 'week' | 'match';

interface PlayerGoalAction {
  id: string;
  playerId: string;
  playerName: string;
  actionType: 'goal' | 'assist' | 'target' | 'save' | 'foul' | 'card';
  matchId: string;
  matchName: string;
  timestamp: string;
  fieldPosition: {
    x: number; // 0-100 (left to right)
    y: number; // 0-100 (bottom to top)
    area: string; // e.g., "Penalty Area", "Midfield", "Right Wing"
  };
  goalType?: 'header' | 'left_foot' | 'right_foot' | 'penalty' | 'free_kick';
  assistType?: 'cross' | 'pass' | 'through_ball' | 'corner';
  details: string;
  minute: number; // Match minute when action occurred
  created_at: string;
}

interface MatchStats {
  matchId: string;
  matchName: string;
  date: string;
  playerStats: {
    [playerId: string]: {
      playerName: string;
      goals: number;
      assists: number;
      targets: number;
      saves: number;
      fouls: number;
      cards: number;
      minutesPlayed: number;
    };
  };
}

interface LastWeekAnalysis {
  playerId: string;
  playerName: string;
  performanceRating: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  trainingAttendance: number;
  injuryRisk: 'low' | 'medium' | 'high';
  notes: string;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  // State management
  const [playerData, setPlayerData] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UI state
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('goals');
  const [timeRange, setTimeRange] = useState<TimeRange>('season');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState<MetricType>('goals');
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Player Performance Goal Tracking state
  const [playerGoalActions, setPlayerGoalActions] = useState<PlayerGoalAction[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'goal-tracking' | 'last-week-analysis'>('overview');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    playerName: '',
    actionType: 'goal' as PlayerGoalAction['actionType'],
    matchName: '',
    fieldX: 50,
    fieldY: 50,
    area: '',
    goalType: 'right_foot' as NonNullable<PlayerGoalAction['goalType']>,
    assistType: 'pass' as NonNullable<PlayerGoalAction['assistType']>,
    details: '',
    minute: 1
  });
  
  // Last Week Analysis state
  const [lastWeekAnalysis, setLastWeekAnalysis] = useState<LastWeekAnalysis[]>([]);
  const [isAddingAnalysis, setIsAddingAnalysis] = useState(false);
  const [analysisForm, setAnalysisForm] = useState({
    playerId: '',
    playerName: '',
    performanceRating: 5,
    goals: 0,
    assists: 0,
    minutesPlayed: 0,
    trainingAttendance: 100,
    injuryRisk: 'low' as 'low' | 'medium' | 'high',
    notes: ''
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('Please log in to view analytics');
          return;
        }

        // Load real player performance data
        const playerPerformanceData = await realAnalyticsService.getPlayerPerformance(user.id);
        
        // Transform to match expected format
        const transformedData = playerPerformanceData.map(player => ({
          id: parseInt(player.playerId),
          name: player.name,
          goals: player.goals,
          assists: player.assists,
          minutes: player.totalMinutes,
          passes: 0, // Not available in current schema
          accuracy: player.passAccuracy,
          rating: player.averageRating.toString(),
          form: player.form,
          position: player.position,
          nationality: 'International',
          age: 25, // Default value
          height: 175, // Default value
          weight: 70, // Default value
          fitnessLevel: 80, // Default value
          injuryRisk: 20, // Default value
          potentialGrowth: 15, // Default value
          mentalState: 'Focused',
          trainingLoad: 75, // Default value
          personalizedTips: [`Focus on ${player.name}'s development`]
        }));
        
        setPlayerData(transformedData);
        setIsLive(false); // Default to false without real-time data
        
        // Load saved goal actions and match stats
        const savedGoalActions = localStorage.getItem('playerGoalActions');
        if (savedGoalActions) {
          setPlayerGoalActions(JSON.parse(savedGoalActions));
        }
        
        const savedMatchStats = localStorage.getItem('matchStats');
        if (savedMatchStats) {
          setMatchStats(JSON.parse(savedMatchStats));
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error);
        toast.error('Failed to load analytics data');
        // Set empty data on error
        setPlayerData([]);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Save goal actions to localStorage
  useEffect(() => {
    localStorage.setItem('playerGoalActions', JSON.stringify(playerGoalActions));
  }, [playerGoalActions]);
  
  // Save match stats to localStorage
  useEffect(() => {
    localStorage.setItem('matchStats', JSON.stringify(matchStats));
  }, [matchStats]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const playerPerformanceData = await realAnalyticsService.getPlayerPerformance(user.id);
        
        const transformedData = playerPerformanceData.map(player => ({
          id: parseInt(player.playerId),
          name: player.name,
          goals: player.goals,
          assists: player.assists,
          minutes: player.totalMinutes,
          passes: 0,
          accuracy: player.passAccuracy,
          rating: player.averageRating.toString(),
          form: player.form,
          position: player.position,
          nationality: 'International',
          age: 25,
          height: 175,
          weight: 70,
          fitnessLevel: 80,
          injuryRisk: 20,
          potentialGrowth: 15,
          mentalState: 'Focused',
          trainingLoad: 75,
          personalizedTips: [`Focus on ${player.name}'s development`]
        }));
        
        setPlayerData(transformedData);
        // Keep current isLive state during auto-refresh
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filtered and sorted players
  const filteredPlayers = useMemo(() => {
    let filtered = playerData.filter(player =>
      player.name.toLowerCase().includes(filterValue.toLowerCase())
    );

    // Sort by selected metric
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      return bValue - aValue; // Descending order
    });

    return filtered;
  }, [playerData, filterValue, sortBy]);

  // Chart data preparation
  const chartData = useMemo(() => {
    return filteredPlayers.slice(0, 10).map((player, index) => ({
      name: player.name,
      goals: player.goals || 0,
      assists: player.assists || 0,
      accuracy: player.accuracy || 0,
      minutes: player.minutes || 0,
      passes: player.passes || 0,
      fill: COLORS[index % COLORS.length]
    }));
  }, [filteredPlayers]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in to refresh data');
        return;
      }

      const playerPerformanceData = await realAnalyticsService.getPlayerPerformance(user.id);
      
      const transformedData = playerPerformanceData.map(player => ({
        id: parseInt(player.playerId),
        name: player.name,
        goals: player.goals,
        assists: player.assists,
        minutes: player.totalMinutes,
        passes: 0,
        accuracy: player.passAccuracy,
        rating: player.averageRating.toString(),
        form: player.form,
        position: player.position,
        nationality: 'International',
        age: 25,
        height: 175,
        weight: 70,
        fitnessLevel: 80,
        injuryRisk: 20,
        potentialGrowth: 15,
        mentalState: 'Focused',
        trainingLoad: 75,
        personalizedTips: [`Focus on ${player.name}'s development`]
      }));
      
      setPlayerData(transformedData);
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler functions for Select components
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRange);
  };

  const handleMetricChange = (value: string) => {
    setSelectedMetric(value as MetricType);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as MetricType);
  };

  // Export data handler
  const handleExport = () => {
    const dataStr = JSON.stringify(filteredPlayers, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };
  
  // Player Goal Action Functions
  const addPlayerGoalAction = () => {
    if (!goalForm.playerName.trim() || !goalForm.matchName.trim()) {
      toast.error('Please provide player name and match name');
      return;
    }

    const now = new Date().toISOString();
    const playerId = goalForm.playerName.toLowerCase().replace(/\s+/g, '-');
    const matchId = goalForm.matchName.toLowerCase().replace(/\s+/g, '-');
    
    const newAction: PlayerGoalAction = {
      id: Date.now().toString(),
      playerId,
      playerName: goalForm.playerName,
      actionType: goalForm.actionType,
      matchId,
      matchName: goalForm.matchName,
      timestamp: now,
      fieldPosition: {
        x: goalForm.fieldX,
        y: goalForm.fieldY,
        area: goalForm.area || getFieldArea(goalForm.fieldX, goalForm.fieldY)
      },
      ...(goalForm.actionType === 'goal' && { goalType: goalForm.goalType }),
      ...(goalForm.actionType === 'assist' && { assistType: goalForm.assistType }),
      details: goalForm.details,
      minute: goalForm.minute,
      created_at: now
    };

    setPlayerGoalActions(prev => [newAction, ...prev]);
    updateMatchStats(matchId, goalForm.matchName, playerId, goalForm.playerName, goalForm.actionType);
    
    // Reset form
    setGoalForm({
      playerName: '',
      actionType: 'goal',
      matchName: '',
      fieldX: 50,
      fieldY: 50,
      area: '',
      goalType: 'right_foot' as NonNullable<PlayerGoalAction['goalType']>,
      assistType: 'pass' as NonNullable<PlayerGoalAction['assistType']>,
      details: '',
      minute: 1
    });
    setIsAddingGoal(false);
    toast.success(`${goalForm.actionType.charAt(0).toUpperCase() + goalForm.actionType.slice(1)} recorded successfully!`);
  };
  
  const getFieldArea = (x: number, y: number): string => {
    if (y < 20) return 'Defensive Third';
    if (y > 80) return 'Attacking Third';
    if (x < 25) return 'Left Wing';
    if (x > 75) return 'Right Wing';
    return 'Midfield';
  };
  
  const updateMatchStats = (matchId: string, matchName: string, playerId: string, playerName: string, actionType: PlayerGoalAction['actionType']) => {
    setMatchStats(prev => {
      const existingMatch = prev.find(m => m.matchId === matchId);
      
      if (existingMatch) {
        return prev.map(match => {
          if (match.matchId === matchId) {
            const updatedMatch = { ...match };
            if (!updatedMatch.playerStats[playerId]) {
              updatedMatch.playerStats[playerId] = {
                playerName,
                goals: 0,
                assists: 0,
                targets: 0,
                saves: 0,
                fouls: 0,
                cards: 0,
                minutesPlayed: 90
              };
            }
            
            switch (actionType) {
              case 'goal':
                updatedMatch.playerStats[playerId].goals += 1;
                break;
              case 'assist':
                updatedMatch.playerStats[playerId].assists += 1;
                break;
              case 'target':
                updatedMatch.playerStats[playerId].targets += 1;
                break;
              case 'save':
                updatedMatch.playerStats[playerId].saves += 1;
                break;
              case 'foul':
                updatedMatch.playerStats[playerId].fouls += 1;
                break;
              case 'card':
                updatedMatch.playerStats[playerId].cards += 1;
                break;
            }
            
            return updatedMatch;
          }
          return match;
        });
      } else {
        const newMatch: MatchStats = {
          matchId,
          matchName,
          date: new Date().toISOString().split('T')[0] || '',
          playerStats: {
            [playerId]: {
              playerName,
              goals: actionType === 'goal' ? 1 : 0,
              assists: actionType === 'assist' ? 1 : 0,
              targets: actionType === 'target' ? 1 : 0,
              saves: actionType === 'save' ? 1 : 0,
              fouls: actionType === 'foul' ? 1 : 0,
              cards: actionType === 'card' ? 1 : 0,
              minutesPlayed: 90
            }
          }
        };
        return [...prev, newMatch];
      }
    });
  };
  
  const deleteGoalAction = (actionId: string) => {
    setPlayerGoalActions(prev => prev.filter(action => action.id !== actionId));
    toast.success('Action deleted successfully');
  };
  
  const getActionIcon = (actionType: PlayerGoalAction['actionType']) => {
    switch (actionType) {
      case 'goal': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'assist': return <Users className="h-4 w-4 text-blue-500" />;
      case 'target': return <Target className="h-4 w-4 text-green-500" />;
      case 'save': return <Shield className="h-4 w-4 text-purple-500" />;
      case 'foul': return <X className="h-4 w-4 text-red-500" />;
      case 'card': return <Calendar className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const exportGoalData = () => {
    const data = {
      playerGoalActions,
      matchStats,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `goal-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Goal analytics exported successfully!');
  };

  // Last Week Analysis Functions
  const addLastWeekAnalysis = () => {
    if (!analysisForm.playerName.trim()) {
      toast.error('Please provide player name');
      return;
    }

    const newAnalysis: LastWeekAnalysis = {
      playerId: Date.now().toString(),
      playerName: analysisForm.playerName,
      performanceRating: analysisForm.performanceRating,
      goals: analysisForm.goals,
      assists: analysisForm.assists,
      minutesPlayed: analysisForm.minutesPlayed,
      trainingAttendance: analysisForm.trainingAttendance,
      injuryRisk: analysisForm.injuryRisk,
      notes: analysisForm.notes
    };

    setLastWeekAnalysis(prev => [newAnalysis, ...prev]);
    
    // Reset form
    setAnalysisForm({
      playerId: '',
      playerName: '',
      performanceRating: 5,
      goals: 0,
      assists: 0,
      minutesPlayed: 0,
      trainingAttendance: 100,
      injuryRisk: 'low',
      notes: ''
    });
    setIsAddingAnalysis(false);
    toast.success('Analysis recorded successfully!');
  };

  const deleteAnalysis = (playerId: string) => {
    setLastWeekAnalysis(prev => prev.filter(analysis => analysis.playerId !== playerId));
    toast.success('Analysis deleted successfully');
  };

  const getInjuryRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Chart rendering component
  const ChartRenderer = () => {
    if (chartType === 'bar') {
      return (
        <RechartsBarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={selectedMetric} fill="#8884d8" />
        </RechartsBarChart>
      );
    }
    
    if (chartType === 'line') {
      return (
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={selectedMetric} stroke="#8884d8" strokeWidth={2} />
        </RechartsLineChart>
      );
    }
    
    if (chartType === 'pie') {
      return (
        <RechartsPieChart>
          <Pie
            data={chartData.slice(0, 6)}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={selectedMetric}
          >
            {chartData.slice(0, 6).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPieChart>
      );
    }
    
    return null;
  };

  // Loading state
  if (dataLoading) {
    return (
      <div className={`space-y-6 p-6 bg-gray-50 min-h-screen ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-6 bg-gray-50 min-h-screen ${className}`}>
      {/* Header Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Activity className="w-8 h-8 mr-3 text-primary" />
              Advanced Analytics Dashboard
              {isLive && (
                <Badge className="ml-3 bg-red-500 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  LIVE
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {activeTab === 'overview' 
                ? 'Real-time performance analytics and insights'
                : activeTab === 'goal-tracking'
                ? 'Track detailed player goals, assists, and field positions'
                : 'Last week performance analysis and player form tracking'
              }
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'overview' ? (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                    id="auto-refresh"
                  />
                  <label htmlFor="auto-refresh" className="text-sm font-medium">
                    Auto Refresh
                  </label>
                </div>
                
                <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="season">Season</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </>
            ) : activeTab === 'goal-tracking' ? (
              <>
                <Button onClick={exportGoalData} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Goals
                </Button>
                <Button onClick={() => setIsAddingGoal(true)} className="bg-green-600 hover:bg-green-700" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal Action
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsAddingAnalysis(true)} className="bg-green-600 hover:bg-green-700" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Analysis
                </Button>
              </>
            )}

            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isProcessing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-6 flex space-x-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2 inline" />
            Overview Analytics
          </button>
          <button
            onClick={() => setActiveTab('goal-tracking')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'goal-tracking'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trophy className="h-4 w-4 mr-2 inline" />
            Player Goal Tracking
          </button>
          <button
            onClick={() => setActiveTab('last-week-analysis')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'last-week-analysis'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4 mr-2 inline" />
            Last Week Analysis
          </button>
        </div>
      </motion.div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedMetric} onValueChange={handleMetricChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goals">Goals</SelectItem>
                <SelectItem value="assists">Assists</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="passes">Passes</SelectItem>
                <SelectItem value="accuracy">Accuracy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goals">Goals</SelectItem>
                <SelectItem value="assists">Assists</SelectItem>
                <SelectItem value="accuracy">Accuracy</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="passes">Passes</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                title="Line Chart"
              >
                <LineChart className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
                title="Pie Chart"
              >
                <PieChart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'overview' && (
        <>
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerData.length}</div>
              <p className="text-xs text-muted-foreground">Active players</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerData.reduce((sum, player) => sum + (player.goals || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">This season</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assists</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerData.reduce((sum, player) => sum + (player.assists || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">This season</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerData.length > 0 
                  ? Math.round(playerData.reduce((sum, player) => sum + (player.accuracy || 0), 0) / playerData.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Team average</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Chart */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Player Performance - {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ChartRenderer />
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player List */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPlayers.map((player, index) => (
                <div
                  key={player.id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    <p className="text-sm text-gray-600">{player.position || 'Player'}</p>
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold">{player.goals || 0}</div>
                      <div className="text-gray-500">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{player.assists || 0}</div>
                      <div className="text-gray-500">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{player.accuracy || 0}%</div>
                      <div className="text-gray-500">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{player.minutes || 0}</div>
                      <div className="text-gray-500">Minutes</div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredPlayers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No players found. Try adjusting your search criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
        </>
      )}
      
      {/* Goal Tracking Section */}
      {activeTab === 'goal-tracking' && (
        <>
          {/* Add Goal Action Modal/Form */}
          {isAddingGoal && (
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Add Player Goal Action</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsAddingGoal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Player Name</label>
                      <Input
                        placeholder="Enter player name"
                        value={goalForm.playerName}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, playerName: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Action Type</label>
                      <Select value={goalForm.actionType} onValueChange={(value) => setGoalForm(prev => ({ ...prev, actionType: value as PlayerGoalAction['actionType'] }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="goal">Goal</SelectItem>
                          <SelectItem value="assist">Assist</SelectItem>
                          <SelectItem value="target">Target/Shot</SelectItem>
                          <SelectItem value="save">Save</SelectItem>
                          <SelectItem value="foul">Foul</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Match Name</label>
                      <Input
                        placeholder="e.g., vs Barcelona"
                        value={goalForm.matchName}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, matchName: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Match Minute</label>
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        value={goalForm.minute}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, minute: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Field Area</label>
                      <Input
                        placeholder="e.g., Penalty Area, Right Wing"
                        value={goalForm.area}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, area: e.target.value }))}
                      />
                    </div>
                    
                    {goalForm.actionType === 'goal' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Goal Type</label>
                        <Select value={goalForm.goalType || ''} onValueChange={(value) => setGoalForm(prev => ({ ...prev, goalType: value as NonNullable<PlayerGoalAction['goalType']> }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="right_foot">Right Foot</SelectItem>
                            <SelectItem value="left_foot">Left Foot</SelectItem>
                            <SelectItem value="header">Header</SelectItem>
                            <SelectItem value="penalty">Penalty</SelectItem>
                            <SelectItem value="free_kick">Free Kick</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {goalForm.actionType === 'assist' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Assist Type</label>
                        <Select value={goalForm.assistType || ''} onValueChange={(value) => setGoalForm(prev => ({ ...prev, assistType: value as NonNullable<PlayerGoalAction['assistType']> }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="cross">Cross</SelectItem>
                            <SelectItem value="through_ball">Through Ball</SelectItem>
                            <SelectItem value="corner">Corner Kick</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  {/* Field Position Selector */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">Field Position</label>
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-green-300 opacity-50"></div>
                      <div className="absolute inset-2 border-2 border-white rounded"></div>
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white"></div>
                      <div className="absolute left-1/2 top-1/2 w-12 h-12 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                      
                      {/* Clickable field marker */}
                      <div
                        className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{
                          left: `${goalForm.fieldX}%`,
                          top: `${100 - goalForm.fieldY}%`
                        }}
                        title={`Position: ${goalForm.fieldX}, ${goalForm.fieldY}`}
                      />
                      
                      {/* Click handler for field */}
                      <div
                        className="absolute inset-0 cursor-crosshair"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                          const y = Math.round((1 - (e.clientY - rect.top) / rect.height) * 100);
                          setGoalForm(prev => ({ ...prev, fieldX: x, fieldY: y }));
                        }}
                      />
                      
                      <div className="absolute bottom-2 left-2 text-xs text-green-800 font-medium">Own Goal</div>
                      <div className="absolute bottom-2 right-2 text-xs text-green-800 font-medium">Opponent Goal</div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Click on the field to set position. Current: X={goalForm.fieldX}, Y={goalForm.fieldY} 
                      ({getFieldArea(goalForm.fieldX, goalForm.fieldY)})
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Additional Details</label>
                    <Input
                      placeholder="e.g., Great teamwork, Counter attack, etc."
                      value={goalForm.details}
                      onChange={(e) => setGoalForm(prev => ({ ...prev, details: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Button onClick={addPlayerGoalAction} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Save Action
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Goal Actions List */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Player Actions ({playerGoalActions.length})</CardTitle>
                  {!isAddingGoal && (
                    <Button onClick={() => setIsAddingGoal(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {playerGoalActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No player actions recorded yet.</p>
                    <p className="text-sm">Start tracking goals, assists, and other actions!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {playerGoalActions.slice(0, 20).map((action, index) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          {getActionIcon(action.actionType)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{action.playerName}</h3>
                              <Badge variant="outline" className="text-xs">
                                {action.actionType.charAt(0).toUpperCase() + action.actionType.slice(1)}
                              </Badge>
                              {action.goalType && (
                                <Badge variant="secondary" className="text-xs">
                                  {action.goalType.replace('_', ' ')}
                                </Badge>
                              )}
                              {action.assistType && (
                                <Badge variant="secondary" className="text-xs">
                                  {action.assistType.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {action.matchName} • {action.minute}' • {action.fieldPosition.area}
                            </p>
                            {action.details && (
                              <p className="text-xs text-gray-500 mt-1">{action.details}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-right text-xs text-gray-500">
                            <div>Pos: {action.fieldPosition.x}, {action.fieldPosition.y}</div>
                            <div>{new Date(action.created_at).toLocaleDateString()}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGoalAction(action.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Match Statistics Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Match Statistics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {matchStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No match statistics available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {matchStats.slice(0, 5).map((match, index) => (
                      <div
                        key={match.matchId}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">{match.matchName}</h3>
                          <Badge variant="outline">{match.date}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(match.playerStats).map(([playerId, stats]) => (
                            <div key={playerId} className="bg-gray-50 rounded p-3">
                              <h4 className="font-medium mb-2">{stats.playerName}</h4>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="text-center">
                                  <div className="font-bold text-green-600">{stats.goals}</div>
                                  <div className="text-gray-500">Goals</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-blue-600">{stats.assists}</div>
                                  <div className="text-gray-500">Assists</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-bold text-purple-600">{stats.targets}</div>
                                  <div className="text-gray-500">Shots</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      {/* Last Week Analysis Section */}
      {activeTab === 'last-week-analysis' && (
        <>
          {/* Add Analysis Form */}
          {isAddingAnalysis && (
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Last Week Performance Analysis</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsAddingAnalysis(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Player Name</label>
                      <Input
                        placeholder="Enter player name"
                        value={analysisForm.playerName}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, playerName: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Performance Rating (1-10)</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={analysisForm.performanceRating}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, performanceRating: parseInt(e.target.value) || 5 }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Goals</label>
                      <Input
                        type="number"
                        min="0"
                        value={analysisForm.goals}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, goals: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Assists</label>
                      <Input
                        type="number"
                        min="0"
                        value={analysisForm.assists}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, assists: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Minutes Played</label>
                      <Input
                        type="number"
                        min="0"
                        value={analysisForm.minutesPlayed}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, minutesPlayed: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Training Attendance (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={analysisForm.trainingAttendance}
                        onChange={(e) => setAnalysisForm(prev => ({ ...prev, trainingAttendance: parseInt(e.target.value) || 100 }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Injury Risk</label>
                      <Select value={analysisForm.injuryRisk} onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, injuryRisk: value as 'low' | 'medium' | 'high' }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <Input
                      placeholder="Additional observations..."
                      value={analysisForm.notes}
                      onChange={(e) => setAnalysisForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Button onClick={addLastWeekAnalysis} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Save Analysis
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingAnalysis(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Analysis List */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Last Week Analysis ({lastWeekAnalysis.length})</CardTitle>
                  {!isAddingAnalysis && (
                    <Button onClick={() => setIsAddingAnalysis(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Analysis
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {lastWeekAnalysis.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No analysis recorded yet.</p>
                    <p className="text-sm">Start tracking player performance for last week!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {lastWeekAnalysis.map((analysis, index) => (
                      <div
                        key={analysis.playerId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{analysis.playerName}</h3>
                              <Badge variant="outline" className="text-xs">
                                Rating: {analysis.performanceRating}/10
                              </Badge>
                            </div>
                            <div className="flex space-x-4 mt-1">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Goals:</span> {analysis.goals}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Assists:</span> {analysis.assists}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Minutes:</span> {analysis.minutesPlayed}
                              </div>
                            </div>
                            <div className="flex space-x-4 mt-1">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Attendance:</span> {analysis.trainingAttendance}%
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Injury Risk:</span> 
                                <span className={`ml-1 ${getInjuryRiskColor(analysis.injuryRisk)}`}>
                                  {analysis.injuryRisk.charAt(0).toUpperCase() + analysis.injuryRisk.slice(1)}
                                </span>
                              </div>
                            </div>
                            {analysis.notes && (
                              <p className="text-xs text-gray-500 mt-1">Notes: {analysis.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAnalysis(analysis.playerId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};