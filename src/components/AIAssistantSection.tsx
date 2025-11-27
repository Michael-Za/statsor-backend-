import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import './AIAssistantSection.css';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  MessageSquare, 
  Send, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  Sparkles, 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  Download, 
  ArrowLeft, 
  ArrowUp, 
  Minus, 
  RefreshCw,
  Calendar,
  Clock,
  Trophy,
  Heart,
  Footprints,
  Star,
  User,
  Settings,
  FileText,
  Mail,
  Bell,
  Play,
  Pause,
  Square,
  RotateCcw,
  Maximize,
  Minimize,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Eye,
  EyeOff,
  Lightbulb,
  Activity,
  PieChart,
  LineChart,
  BarChart2
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { dataManagementService, Player } from '../services/dataManagementService';
import { aiChatService, AIResponse } from '../services/aiChatService';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'chart' | 'prediction' | 'analysis';
  data?: any;
  confidence?: number;
  suggestions?: string[];
  isTyping?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  prompt?: string;
  requiresData?: boolean;
}

interface MatchHistory {
  opponent: string;
  result: string;
  date: string;
  score?: string;
  performance?: number;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'radar' | 'area';
  data: any[];
  title: string;
  description?: string;
  insights?: string[];
}

interface PredictionData {
  type: 'match' | 'player' | 'tactical';
  confidence: number;
  outcome: string;
  factors: string[];
  recommendations?: string[];
}

export const AIAssistantSection: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEyeFriendlyMode, setIsEyeFriendlyMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI Captain Pro assistant powered by advanced analytics. I can help you with tactical analysis, player performance insights, match predictions, and strategic recommendations. What would you like to explore today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      confidence: 95
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubData, setClubData] = useState<any>(null);
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionData | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Enhanced service monitoring and error recovery
  const [serviceHealth, setServiceHealth] = useState({
    data: 'connecting' as 'connected' | 'disconnected' | 'connecting',
    aiBackend: 'connecting' as 'connected' | 'disconnected' | 'connecting',
    subscription: 'connecting' as 'connected' | 'disconnected' | 'connecting',
    usageStats: 'connecting' as 'connected' | 'disconnected' | 'connecting'
  });
  const [isRecovering, setIsRecovering] = useState(false);
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  const retryDelay = 2000;

  // Check connection status on component mount with enhanced monitoring
  useEffect(() => {
    initializeServices();
    startHealthMonitoring();
    
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
    };
  }, []);

  const initializeServices = async () => {
    setIsRecovering(true);
    await Promise.allSettled([
      checkDataServiceHealth(),
      checkBackendConnection(),
      checkSubscriptionService(),
      checkUsageStatsService(),
      loadTeamDataWithRetry()
    ]);
    setIsRecovering(false);
  };

  const startHealthMonitoring = () => {
    healthCheckInterval.current = setInterval(async () => {
      await performHealthChecks();
    }, 30000); // Check every 30 seconds
  };

  const performHealthChecks = async () => {
    const checks = [
      { name: 'data', check: checkDataServiceHealth },
      { name: 'aiBackend', check: checkBackendConnection },
      { name: 'subscription', check: checkSubscriptionService },
      { name: 'usageStats', check: checkUsageStatsService }
    ];

    for (const { name, check } of checks) {
      const service = serviceHealth[name as keyof typeof serviceHealth];
      if (service === 'disconnected') {
        await check();
      }
    }
  };

  const updateServiceHealth = (serviceName: string, status: 'connected' | 'disconnected' | 'connecting') => {
    setServiceHealth(prev => ({
      ...prev,
      [serviceName]: status
    }));

    // Update legacy status for backward compatibility
    if (serviceName === 'data') {
      setConnectionStatus(status);
    } else if (serviceName === 'aiBackend') {
      setBackendStatus(status);
    }
  };

  const checkDataServiceHealth = async () => {
    try {
      updateServiceHealth('data', 'connecting');
      await dataManagementService.getPlayers();
      updateServiceHealth('data', 'connected');
      return true;
    } catch (error) {
      console.error('Data service health check failed:', error);
      updateServiceHealth('data', 'disconnected');
      
      if (serviceHealth.data === 'connecting') {
        addSystemMessage('Data services are temporarily unavailable. I can still provide general assistance using cached data.');
      }
      return false;
    }
  };

  const checkBackendConnection = async () => {
    try {
      updateServiceHealth('aiBackend', 'connecting');
      const aiAssistantUrl = import.meta.env['VITE_AI_ASSISTANT_BACKEND_URL'] || 'http://localhost:8080';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${aiAssistantUrl}/api/v1/ai/status`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        updateServiceHealth('aiBackend', 'connected');
        return true;
      } else {
        throw new Error(`AI backend returned ${response.status}`);
      }
    } catch (error) {
      console.error('AI backend connection failed:', error);
      updateServiceHealth('aiBackend', 'disconnected');
      
      if (serviceHealth.aiBackend === 'connecting') {
        addSystemMessage('AI processing engine is temporarily offline. I\'ll use my local knowledge base for responses.');
      }
      return false;
    }
  };

  const checkSubscriptionService = async () => {
    try {
      updateServiceHealth('subscription', 'connecting');
      const apiUrl = import.meta.env['VITE_API_URL'] || 'http://localhost:3001';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/api/subscription/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        updateServiceHealth('subscription', 'connected');
        return true;
      } else {
        throw new Error(`Subscription service returned ${response.status}`);
      }
    } catch (error) {
      console.error('Subscription service check failed:', error);
      updateServiceHealth('subscription', 'disconnected');
      return false;
    }
  };

  const checkUsageStatsService = async () => {
    try {
      updateServiceHealth('usageStats', 'connecting');
      const apiUrl = import.meta.env['VITE_API_URL'] || 'http://localhost:3001';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/api/usage/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        updateServiceHealth('usageStats', 'connected');
        return true;
      } else {
        throw new Error(`Usage stats service returned ${response.status}`);
      }
    } catch (error) {
      console.error('Usage stats service check failed:', error);
      updateServiceHealth('usageStats', 'disconnected');
      return false;
    }
  };

  const loadTeamDataWithRetry = async (retryCount = 0) => {
    try {
      const playersData = await dataManagementService.getPlayers();
      setPlayers(playersData);
      
      const clubDataResult = await dataManagementService.getClubData();
      setClubData(clubDataResult);
      
      return true;
    } catch (error) {
      console.error(`Error loading team data (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return loadTeamDataWithRetry(retryCount + 1);
      }
      
      addSystemMessage('Unable to load team data. Some features may be limited until connection is restored.');
      return false;
    }
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const retryFailedServices = async () => {
    setIsRecovering(true);
    toast.info('Attempting to reconnect services...');
    
    const failedServices = Object.entries(serviceHealth)
      .filter(([_, service]) => service === 'disconnected')
      .map(([name]) => name);
    
    const results = await Promise.allSettled(
      failedServices.map(async (serviceName) => {
        switch (serviceName) {
          case 'dataService':
            return checkDataServiceHealth();
          case 'aiBackend':
            return checkBackendConnection();
          case 'subscription':
            return checkSubscriptionService();
          case 'usageStats':
            return checkUsageStatsService();
          default:
            return false;
        }
      })
    );
    
    const reconnectedCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;
    
    if (reconnectedCount > 0) {
      toast.success(`Reconnected ${reconnectedCount} service(s)`);
      addSystemMessage(`Successfully reconnected ${reconnectedCount} service(s). Full functionality restored.`);
    } else {
      toast.error('Unable to reconnect services. Please check your internet connection.');
    }
    
    setIsRecovering(false);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'formation',
      title: 'Tactical Analysis',
      description: 'Analyze current formation and suggest improvements',
      icon: <Target className="w-5 h-5" />,
      category: 'Tactics',
      prompt: 'Analyze our current tactical setup and formation. Provide insights on strengths, weaknesses, and tactical adjustments we should consider.',
      requiresData: true
    },
    {
      id: 'performance',
      title: 'Player Performance',
      description: 'Deep dive into individual player metrics',
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'Analysis',
      prompt: 'Provide a comprehensive analysis of our players\' recent performances, highlighting top performers and areas for improvement.',
      requiresData: true
    },
    {
      id: 'prediction',
      title: 'Match Prediction',
      description: 'AI-powered match outcome prediction',
      icon: <Brain className="w-5 h-5" />,
      category: 'Prediction',
      prompt: 'Predict the outcome of our next match based on current form, player fitness, and tactical analysis.',
      requiresData: true
    },
    {
      id: 'team-analysis',
      title: 'Team Dynamics',
      description: 'Overall team chemistry and performance',
      icon: <Users className="w-5 h-5" />,
      category: 'Analysis',
      prompt: 'Analyze our team\'s overall dynamics, chemistry, and collective performance trends.',
      requiresData: true
    },
    {
      id: 'injury-risk',
      title: 'Injury Assessment',
      description: 'Predict and prevent player injuries',
      icon: <Heart className="w-5 h-5" />,
      category: 'Health',
      prompt: 'Assess injury risks for our players based on workload, fitness data, and match intensity.',
      requiresData: true
    },
    {
      id: 'opponent-analysis',
      title: 'Opponent Scout',
      description: 'Analyze upcoming opponents',
      icon: <Eye className="w-5 h-5" />,
      category: 'Scouting',
      prompt: 'Provide detailed scouting report on our next opponent, including their strengths, weaknesses, and tactical preferences.',
      requiresData: false
    },
    {
      id: 'training-plan',
      title: 'Training Optimization',
      description: 'Personalized training recommendations',
      icon: <Zap className="w-5 h-5" />,
      category: 'Training',
      prompt: 'Create optimized training plans based on upcoming matches, player fitness, and performance data.',
      requiresData: true
    },
    {
      id: 'market-analysis',
      title: 'Transfer Insights',
      description: 'Player market and transfer analysis',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'Transfers',
      prompt: 'Analyze the transfer market and suggest potential signings that would improve our squad.',
      requiresData: true
    },
    {
      id: 'season-summary',
      title: 'Season Summary',
      description: 'Review season performance and statistics',
      icon: <FileText className="w-5 h-5" />,
      category: 'Analysis',
      prompt: 'Provide a comprehensive summary of our season performance, key statistics, and areas for improvement.',
      requiresData: true
    },
    {
      id: 'communication',
      title: 'Communication Plan',
      description: 'Coordinate team messages and announcements',
      icon: <Mail className="w-5 h-5" />,
      category: 'Team Management',
      prompt: 'Help me create effective communication strategies for the team, including motivational messages and tactical briefings.',
      requiresData: false
    },
    {
      id: 'schedule',
      title: 'Schedule Optimization',
      description: 'Optimize training and match schedules',
      icon: <Calendar className="w-5 h-5" />,
      category: 'Team Management',
      prompt: 'Analyze our current schedule and suggest optimizations for training sessions and match preparation.',
      requiresData: true
    },
    {
      id: 'tactical-board',
      title: 'Tactical Board',
      description: 'Visualize and plan tactical approaches',
      icon: <Settings className="w-5 h-5" />,
      category: 'Tactical',
      prompt: 'Help me visualize and plan tactical approaches for different match scenarios and opponent strategies.',
      requiresData: true
    }
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const simulateTyping = useCallback(async (message: string) => {
    setIsTyping(true);
    // Simulate realistic typing delay based on message length
    const typingDelay = Math.min(message.length * 50, 3000);
    await new Promise(resolve => setTimeout(resolve, typingDelay));
    setIsTyping(false);
  }, []);

  const generateChartData = useCallback((query: string, data: any): ChartData | null => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('performance') || lowerQuery.includes('stats')) {
      return {
        type: 'bar',
        title: 'Player Performance Analysis',
        data: players.slice(0, 10).map(player => ({
          name: player.name,
          goals: Math.floor(Math.random() * 20),
          assists: Math.floor(Math.random() * 15),
          rating: (Math.random() * 2 + 7).toFixed(1)
        })),
        insights: [
          'Top performers show consistent goal-scoring ability',
          'Assist distribution indicates good team chemistry',
          'Average team rating has improved by 12% this season'
        ]
      };
    }
    
    if (lowerQuery.includes('formation') || lowerQuery.includes('tactical')) {
      return {
        type: 'radar',
        title: 'Tactical Analysis',
        data: [
          { metric: 'Attack', value: 85, fullMark: 100 },
          { metric: 'Defense', value: 78, fullMark: 100 },
          { metric: 'Midfield', value: 82, fullMark: 100 },
          { metric: 'Pressing', value: 75, fullMark: 100 },
          { metric: 'Possession', value: 88, fullMark: 100 },
          { metric: 'Counter', value: 70, fullMark: 100 }
        ],
        insights: [
          'Strong possession-based play style',
          'Defensive stability needs improvement',
          'Counter-attacking could be more effective'
        ]
      };
    }
    
    return null;
  }, [players]);

  const generatePrediction = useCallback((query: string): PredictionData | null => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('match') || lowerQuery.includes('predict')) {
      return {
        type: 'match',
        confidence: Math.floor(Math.random() * 30 + 70),
        outcome: 'Win',
        factors: [
          'Current form: 4 wins in last 5 matches',
          'Home advantage: +15% win probability',
          'Key players fit and available',
          'Favorable tactical matchup'
        ],
        recommendations: [
          'Focus on early pressing to disrupt opponent rhythm',
          'Utilize wing play to exploit defensive weaknesses',
          'Maintain possession in midfield third'
        ]
      };
    }
    
    return null;
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate typing
      await simulateTyping(currentInput);
      
      const userContext = {
        userId: user?.id || 'anonymous',
        teamData: {
          players,
          club: clubData
        }
      };

      const aiResponse: AIResponse = await aiChatService.processMessage(currentInput, userContext);
      
      // Generate chart data if relevant
      const chartData = generateChartData(currentInput, { players, clubData });
      const predictionData = generatePrediction(currentInput);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        sender: 'ai',
        timestamp: new Date(),
        type: chartData ? 'chart' : predictionData ? 'prediction' : 'text',
        data: chartData || predictionData,
        confidence: aiResponse.confidence || Math.floor(Math.random() * 20 + 80),
        suggestions: aiResponse.suggestions || [
          'Would you like more detailed analysis?',
          'Should I provide tactical recommendations?',
          'Need help with player-specific insights?'
        ]
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (chartData) setSelectedChart(chartData);
      if (predictionData) setCurrentPrediction(predictionData);
      
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment. In the meantime, you can use the quick actions below for common queries.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Connection issue - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = async (action: QuickAction) => {
    if (isLoading) return;
    
    // Add user message for the action
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: action.title,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Simulate typing for more realistic interaction
      await simulateTyping(action.prompt || action.title);
      
      const userContext = {
        userId: user?.id || 'anonymous',
        playerData: players,
        clubData: clubData
      };

      const prompt = action.prompt || action.title;
      const response = await aiChatService.processMessage(prompt, userContext);
      
      // Generate relevant data based on action type
      const chartData = generateChartData(prompt, { players, clubData });
      const predictionData = generatePrediction(prompt);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        type: chartData ? 'chart' : predictionData ? 'prediction' : 'text',
        data: chartData || predictionData,
        confidence: response.confidence || Math.floor(Math.random() * 20 + 85),
        suggestions: getActionSuggestions(action.category)
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (chartData) setSelectedChart(chartData);
      if (predictionData) setCurrentPrediction(predictionData);
      
    } catch (error) {
      console.error('Error processing action:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I couldn't process the ${action.title.toLowerCase()} request right now. This might be due to insufficient data or a temporary connection issue. Please try again or use a different approach.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error(`Failed to process ${action.title}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionSuggestions = (category: string): string[] => {
    const suggestions: Record<string, string[]> = {
      'Tactics': [
        'Would you like formation alternatives?',
        'Should I analyze opponent weaknesses?',
        'Need set-piece strategies?'
      ],
      'Analysis': [
        'Want detailed player comparisons?',
        'Should I show performance trends?',
        'Need injury risk assessment?'
      ],
      'Prediction': [
        'Would you like scenario analysis?',
        'Should I factor in weather conditions?',
        'Need confidence intervals?'
      ],
      'Health': [
        'Want recovery time estimates?',
        'Should I suggest prevention strategies?',
        'Need fitness tracking recommendations?'
      ]
    };
    
    return suggestions[category] || [
      'Would you like more details?',
      'Should I provide additional insights?',
      'Need related recommendations?'
    ];
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    toast.success(isFullScreen ? 'Exited full screen' : 'Entered full screen mode');
  };

  const toggleEyeFriendlyMode = () => {
    setIsEyeFriendlyMode(!isEyeFriendlyMode);
    toast.success(isEyeFriendlyMode ? 'Eye-friendly mode disabled' : 'Eye-friendly mode enabled');
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const analyticsData = {
    winProbability: 72,
    formationEfficiency: 85,
    pressingIntensity: 68,
    counterAttackSuccess: 91,
    possession: 58,
    shotsOnTarget: 42,
    passingAccuracy: 87,
    defensiveStability: 76
  };

  const performanceData = players.length > 0 ? [
    { name: 'Jan', goals: 12, assists: 8, wins: 6, avgRating: 7.2 },
    { name: 'Feb', goals: 15, assists: 10, wins: 7, avgRating: 7.5 },
    { name: 'Mar', goals: 18, assists: 12, wins: 8, avgRating: 7.8 },
    { name: 'Apr', goals: 22, assists: 15, wins: 9, avgRating: 8.1 },
    { name: 'May', goals: 25, assists: 18, wins: 10, avgRating: 8.4 }
  ] : [
    { name: 'Jan', goals: 12, assists: 8, wins: 6, avgRating: 7.2 },
    { name: 'Feb', goals: 15, assists: 10, wins: 7, avgRating: 7.5 },
    { name: 'Mar', goals: 18, assists: 12, wins: 8, avgRating: 7.8 },
    { name: 'Apr', goals: 22, assists: 15, wins: 9, avgRating: 8.1 },
    { name: 'May', goals: 25, assists: 18, wins: 10, avgRating: 8.4 }
  ];

  const playerEfficiencyData = [
    { name: 'Passing', value: 85, fullMark: 100 },
    { name: 'Shooting', value: 78, fullMark: 100 },
    { name: 'Defending', value: 92, fullMark: 100 },
    { name: 'Dribbling', value: 73, fullMark: 100 },
    { name: 'Fitness', value: 88, fullMark: 100 },
    { name: 'Teamwork', value: 95, fullMark: 100 }
  ];

  const tacticalDistribution = [
    { name: 'Attack', value: 35, color: '#3B82F6' },
    { name: 'Midfield', value: 40, color: '#10B981' },
    { name: 'Defense', value: 25, color: '#F59E0B' }
  ];

  const playerStatsData = players.map(player => ({
    name: player.name,
    goals: player.goals || 0,
    assists: player.assists || 0,
    rating: player.skills ? Math.round((player.skills.technical + player.skills.physical + player.skills.tactical + player.skills.mental) / 4) : 75,
    fitness: player.fitness || 80
  }));

  const matchPredictions = [
    { opponent: 'Real Madrid', winProb: 68, drawProb: 22, lossProb: 10, difficulty: 'High' },
    { opponent: 'Valencia', winProb: 82, drawProb: 15, lossProb: 3, difficulty: 'Medium' },
    { opponent: 'Sevilla', winProb: 75, drawProb: 18, lossProb: 7, difficulty: 'Medium' },
    { opponent: 'Barcelona', winProb: 55, drawProb: 25, lossProb: 20, difficulty: 'High' },
    { opponent: 'Atletico Madrid', winProb: 62, drawProb: 23, lossProb: 15, difficulty: 'High' }
  ];

  const matchHistory: MatchHistory[] = [
    { opponent: 'Real Madrid', result: 'L 1-2', date: '2023-10-01' },
    { opponent: 'Valencia', result: 'W 3-1', date: '2023-10-08' },
    { opponent: 'Sevilla', result: 'D 2-2', date: '2023-10-15' },
    { opponent: 'Barcelona', result: 'L 0-4', date: '2023-10-22' },
    { opponent: 'Atletico Madrid', result: 'W 2-1', date: '2023-10-29' }
  ];

  const keyInsights = [
    {
      type: 'positive',
      title: 'Attacking Efficiency Up 23%',
      description: 'Goals per game increased from 1.8 to 2.2 this month',
      impact: 'High'
    },
    {
      type: 'warning',
      title: 'Defensive Vulnerability',
      description: 'Conceding 15% more goals from set pieces',
      impact: 'Medium'
    },
    {
      type: 'positive',
      title: 'Player Fitness Peak',
      description: '92% of squad at optimal fitness levels',
      impact: 'High'
    },
    {
      type: 'warning',
      title: 'Midfield Control',
      description: 'Possession dropped 8% in away matches',
      impact: 'Medium'
    }
  ];

  const playerAnalytics = players.length > 0 ? players.map(player => ({
    name: player.name,
    position: player.position,
    goals: player.goals || 0,
    assists: player.assists || 0,
    rating: player.skills ? Math.round((player.skills.technical + player.skills.physical + player.skills.tactical + player.skills.mental) / 4) / 10 : 7.5,
    form: player.fitness && player.fitness > 85 ? 'excellent' : player.fitness && player.fitness > 75 ? 'good' : 'average'
  })) : [
    { name: 'Torres', position: 'ST', goals: 18, assists: 7, rating: 8.4, form: 'excellent' },
    { name: 'Silva', position: 'CM', goals: 5, assists: 12, rating: 8.1, form: 'good' },
    { name: 'Rodriguez', position: 'CB', goals: 2, assists: 1, rating: 7.8, form: 'good' },
    { name: 'Martinez', position: 'GK', goals: 0, assists: 0, rating: 8.2, form: 'excellent' }
  ];

  const containerClasses = `
    ${isFullScreen ? 'fixed inset-0 z-50' : 'h-full w-full'}
    ${isEyeFriendlyMode ? 'filter brightness-90 contrast-90' : ''}
    flex flex-col
  `;

  const cardClasses = `
    h-full w-full flex flex-col
    ${isHighContrast ? 'hc-card' :
      theme === 'midnight' 
        ? isEyeFriendlyMode 
          ? 'bg-green-50/80 border-green-200'
          : 'bg-white border-gray-200'
        : isEyeFriendlyMode
          ? 'bg-green-50/80 border-green-200'
          : 'bg-white border-gray-200'
    }
    backdrop-blur-sm transition-all duration-300
    ${isFullScreen ? 'rounded-none border-0' : 'rounded-lg'}
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className={containerClasses}
    >
      <Card className={cardClasses}>
        <CardHeader className={`${'border-gray-100'} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!isFullScreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.history.back()}
                  className="mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
            
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
                <Bot className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <CardTitle className={`${'text-gray-900'} flex items-center space-x-2`}>
                  <span>AI Assistant</span>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 border-0">
                    Enhanced
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Intelligent Football Management Assistant
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEyeFriendlyMode}
                className={`p-2 ${
                  isEyeFriendlyMode ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : ''
                }`}
                title="Toggle Eye-Friendly Mode"
              >
                {isEyeFriendlyMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullScreen}
                className="p-2"
                title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              >
                {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
              
              <div className="flex flex-col items-end space-y-1">
                {/* Enhanced Service Health Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    serviceHealth.aiBackend === 'connected' ? 'bg-green-500 animate-pulse' : 
                    serviceHealth.aiBackend === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                    'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    {serviceHealth.aiBackend === 'connected' ? 'AI: Online' : 
                     serviceHealth.aiBackend === 'connecting' ? 'AI: Connecting...' : 
                     'AI: Offline'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    serviceHealth.data === 'connected' ? 'bg-green-500' : 
                    serviceHealth.data === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                    'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    {serviceHealth.data === 'connected' ? 'Data: Online' : 
                     serviceHealth.data === 'connecting' ? 'Data: Connecting...' : 
                     'Data: Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className={`grid w-full grid-cols-2 ${'bg-white border border-gray-200 shadow-sm'} m-4 mb-0 p-1 rounded-xl`}>
              <TabsTrigger 
                value="chat" 
                className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-4 py-2 ${
                  'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-4 py-2 ${
                  'data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Clock className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={'bg-white text-gray-900 border border-gray-200 shadow-sm px-4 py-2 rounded-lg'}>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about tactics, players, or strategy..."
                    className="flex-1 border-gray-200 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: '1', title: 'Team Formation Analysis', date: '2023-10-15', preview: 'Analyzed our 4-3-3 formation and suggested improvements...' },
                    { id: '2', title: 'Player Performance Review', date: '2023-10-10', preview: 'Reviewed player statistics and identified top performers...' },
                    { id: '3', title: 'Match Strategy Discussion', date: '2023-10-05', preview: 'Discussed tactics for upcoming match against Barcelona...' },
                    { id: '4', title: 'Injury Prevention Plan', date: '2023-09-28', preview: 'Created a plan to reduce injury risks for key players...' },
                    { id: '5', title: 'Transfer Market Insights', date: '2023-09-20', preview: 'Analyzed potential signings to strengthen our squad...' },
                    { id: '6', title: 'Training Optimization', date: '2023-09-15', preview: 'Optimized training schedule based on player workload...' }
                  ].map((chat) => (
                    <Card 
                      key={chat.id} 
                      className={'bg-white border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'}
                      onClick={() => {
                        toast.info(`Loading chat: ${chat.title}`);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={'text-gray-900 font-semibold'}>{chat.title}</h3>
                          <p className={'text-gray-600 text-sm mt-1'}>{chat.preview}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                      <div className={'flex items-center mt-3 text-xs text-gray-400'}>
                        <Clock className="h-3 w-3 mr-1" />
                        {chat.date}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
