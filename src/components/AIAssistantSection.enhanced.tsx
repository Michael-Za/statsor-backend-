import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from './ui/tabs';
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
  BarChart2,
  Search,
  TrendingDown,
  Award,
  Database,
  CreditCard,
  Home,
  ChevronLeft,
  AlertCircle,
  Filter,
  SlidersHorizontal
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
  Area,
  Scatter
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { dataManagementService, Player } from '../services/dataManagementService';
import { aiChatService, AIResponse } from '../services/aiChatService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AIAssistantSection.enhanced.css';

// Mock data for demonstration
const mockPlayers: Player[] = [
  { id: '1', name: 'Torres', position: 'ST', goals: 18, assists: 7, age: 24, nationality: 'Spain', fitness: 92 },
  { id: '2', name: 'Silva', position: 'CM', goals: 5, assists: 12, age: 26, nationality: 'Brazil', fitness: 88 },
  { id: '3', name: 'Rodriguez', position: 'CB', goals: 2, assists: 1, age: 28, nationality: 'Argentina', fitness: 90 },
  { id: '4', name: 'Martinez', position: 'GK', goals: 0, assists: 0, age: 29, nationality: 'Uruguay', fitness: 95 },
  { id: '5', name: 'Johnson', position: 'RW', goals: 12, assists: 9, age: 25, nationality: 'England', fitness: 87 },
  { id: '6', name: 'Schmidt', position: 'LB', goals: 1, assists: 8, age: 27, nationality: 'Germany', fitness: 89 },
  { id: '7', name: 'Dubois', position: 'CAM', goals: 9, assists: 15, age: 23, nationality: 'France', fitness: 91 },
  { id: '8', name: 'Kowalski', position: 'LW', goals: 14, assists: 6, age: 26, nationality: 'Poland', fitness: 86 }
];

const mockClubData = {
  name: 'Your Team',
  founded: 1995,
  stadium: 'Your Stadium',
  capacity: 15000,
  budget: 2500000,
  trophies: 8
};

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
  feedback?: 'positive' | 'negative' | null;
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

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'radar' | 'area' | 'scatter';
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEyeFriendlyMode, setIsEyeFriendlyMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: `Hello${user?.name ? ` ${user.name}` : ''}! I'm your AI Captain Pro assistant powered by advanced analytics. I can help you with tactical analysis, player performance insights, match predictions, and strategic recommendations. What would you like to explore today?`,
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [clubData, setClubData] = useState<any>(mockClubData);
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionData | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState('all');
  const [analyticsView, setAnalyticsView] = useState('overview');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const analyticsContainerRef = useRef<HTMLDivElement>(null);

  // Quick prompt buttons
  const quickPrompts = [
    { id: 'analyze', text: 'Analyze my data', icon: <Database className="w-4 h-4" /> },
    { id: 'report', text: 'Generate report', icon: <FileText className="w-4 h-4" /> },
    { id: 'optimize', text: 'Optimize performance', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'insights', text: 'Provide insights', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'prediction', text: 'Match prediction', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'tactics', text: 'Tactical advice', icon: <Target className="w-4 h-4" /> }
  ];

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('connecting');
    try {
      // Try to connect to the AI service using the proper endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/ai-proxy/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'health check',
          context: {}
        })
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      addSystemMessage('I\'m having trouble connecting to the AI assistant service. Please make sure all services are running. If you\'re using Docker, ensure containers are started with: docker-compose up -d');
    }
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const retryConnection = () => {
    checkConnection();
  };

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

      // Connect to the real AI service instead of using mock data
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
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I'm experiencing technical difficulties: ${error.message || 'Unknown error'}. Please try again in a moment.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Connection issue - please try again');
      
      // Provide specific guidance based on error type
      if (error.message && error.message.includes('connect')) {
        toast.info('Tip: Make sure all services are running. Try: docker-compose up -d');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    // Focus the input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleActionClick = async (action: QuickAction) => {
    if (isLoading) return;
    
    // Add user message for the action
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: action.title,
      sender: 'user',
      timestamp: new Date(),
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
      // Connect to the real AI service instead of using mock data
      const response: AIResponse = await aiChatService.processMessage(prompt, userContext);
      
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
        'Would you like to specify match conditions?',
        'Should I provide alternative predictions?',
        'Need historical data comparison?'
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
    { name: 'May', goals: 25, assists: 18, wins: 10, avgRating: 8.4 },
    { name: 'Jun', goals: 28, assists: 20, wins: 11, avgRating: 8.6 }
  ] : [
    { name: 'Jan', goals: 12, assists: 8, wins: 6, avgRating: 7.2 },
    { name: 'Feb', goals: 15, assists: 10, wins: 7, avgRating: 7.5 },
    { name: 'Mar', goals: 18, assists: 12, wins: 8, avgRating: 7.8 },
    { name: 'Apr', goals: 22, assists: 15, wins: 9, avgRating: 8.1 },
    { name: 'May', goals: 25, assists: 18, wins: 10, avgRating: 8.4 },
    { name: 'Jun', goals: 28, assists: 20, wins: 11, avgRating: 8.6 }
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

  // Enhanced analytics data
  const enhancedPerformanceData = [
    { month: 'Jan', goals: 12, assists: 8, wins: 6, avgRating: 7.2, possession: 52, shots: 15 },
    { month: 'Feb', goals: 15, assists: 10, wins: 7, avgRating: 7.5, possession: 55, shots: 18 },
    { month: 'Mar', goals: 18, assists: 12, wins: 8, avgRating: 7.8, possession: 58, shots: 21 },
    { month: 'Apr', goals: 22, assists: 15, wins: 9, avgRating: 8.1, possession: 61, shots: 24 },
    { month: 'May', goals: 25, assists: 18, wins: 10, avgRating: 8.4, possession: 64, shots: 27 },
    { month: 'Jun', goals: 28, assists: 20, wins: 11, avgRating: 8.6, possession: 67, shots: 30 }
  ];

  const formationEffectiveness = [
    { formation: '4-3-3', wins: 8, losses: 2, draws: 2, avgRating: 8.1 },
    { formation: '4-2-3-1', wins: 6, losses: 3, draws: 3, avgRating: 7.8 },
    { formation: '3-5-2', wins: 4, losses: 4, draws: 4, avgRating: 7.5 },
    { formation: '4-4-2', wins: 7, losses: 3, draws: 2, avgRating: 8.0 }
  ];

  const playerScatterData = players.map((player, index) => ({
    name: player.name,
    x: player.goals || 0,
    y: player.assists || 0,
    z: player.fitness || 80,
    position: player.position
  }));

  const containerClasses = `
    ${isFullScreen ? 'fixed inset-0 z-50' : 'h-full w-full'}
    ${isEyeFriendlyMode ? 'filter brightness-90 contrast-90' : ''}
    flex flex-col
  `;

  const cardClasses = `
    h-full w-full flex flex-col
    ${isHighContrast ? 'hc-card' :
      theme === 'dark' || theme === 'midnight' 
        ? isEyeFriendlyMode 
          ? 'bg-gray-900/80 border-gray-700 text-white' 
          : 'bg-gray-900 border-gray-800 text-white'
        : isEyeFriendlyMode
          ? 'bg-blue-50/80 border-blue-200'
          : 'bg-white border-gray-200'
    }
    backdrop-blur-sm transition-all duration-300
    ${isFullScreen ? 'rounded-none border-0' : 'rounded-lg'}
  `;

  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-3 border rounded-lg shadow-lg`}>
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom dot component for line charts
  const CustomDot = (props: any) => {
    const { cx, cy, stroke, payload, value } = props;
    return (
      <svg x={cx - 5} y={cy - 5} width={10} height={10} fill={stroke} viewBox="0 0 10 10">
        <circle cx={5} cy={5} r={5} stroke="none" />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className={containerClasses}
    >
      <Card className={cardClasses}>
        <CardHeader className={`${theme === 'dark' || theme === 'midnight' ? 'border-gray-800' : 'border-gray-100'} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!isFullScreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
            
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg">
                <Bot className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <CardTitle className={`${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'} flex items-center space-x-2`}>
                  <span>AI Captain Pro</span>
                  <Badge className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs px-2 py-1 border-0">
                    GPT-4 Enhanced
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Advanced Football Analytics & Tactical Intelligence
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Connection Status Indicator */}
              <div className="flex items-center">
                {connectionStatus === 'connecting' && (
                  <div className="flex items-center text-yellow-500">
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    <span className="text-xs">Connecting...</span>
                  </div>
                )}
                {connectionStatus === 'connected' && (
                  <div className="flex items-center text-green-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-xs">Online</span>
                  </div>
                )}
                {connectionStatus === 'disconnected' && (
                  <div className="flex items-center text-red-500">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEyeFriendlyMode}
                className={`p-2 ${
                  isEyeFriendlyMode ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''
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
            </div>
          </div>
        </CardHeader>
      
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className={`grid w-full grid-cols-2 ${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white border border-gray-200 shadow-sm'} m-4 mb-0 p-1 rounded-xl`}>
              <TabsTrigger 
                value="chat" 
                className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-4 py-2 ${
                  theme === 'dark' || theme === 'midnight'
                    ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 hover:text-white hover:bg-gray-700/50' 
                    : 'data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-4 py-2 ${
                  theme === 'dark' || theme === 'midnight'
                    ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-300 hover:text-white hover:bg-gray-700/50' 
                    : 'data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Quick Prompts Section */}
                <div className="flex flex-wrap gap-2 py-2">
                  {quickPrompts.map((prompt) => (
                    <Button
                      key={prompt.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className={`flex items-center gap-1 text-xs ${
                        theme === 'dark' || theme === 'midnight'
                          ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {prompt.icon}
                      {prompt.text}
                    </Button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : theme === 'dark' || theme === 'midnight'
                              ? 'bg-gray-700 text-white border border-gray-600' 
                              : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-xs ${
                            message.sender === 'user' ? 'text-blue-100' : theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {message.sender === 'ai' && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-gray-400 hover:text-gray-200"
                                onClick={() => copyMessage(message.content)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-5 w-5 ${
                                  message.feedback === 'positive' 
                                    ? 'text-green-500' 
                                    : 'text-gray-400 hover:text-green-500'
                                }`}
                                onClick={() => {
                                  const updatedMessages: ChatMessage[] = messages.map(m => 
                                    m.id === message.id ? { ...m, feedback: 'positive' } : m
                                  ) as ChatMessage[];
                                  setMessages(updatedMessages);
                                }}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-5 w-5 ${
                                  message.feedback === 'negative' 
                                    ? 'text-red-500' 
                                    : 'text-gray-400 hover:text-red-500'
                                }`}
                                onClick={() => {
                                  const updatedMessages: ChatMessage[] = messages.map(m => 
                                    m.id === message.id ? { ...m, feedback: 'negative' } : m
                                  ) as ChatMessage[];
                                  setMessages(updatedMessages);
                                }}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'} px-4 py-3 rounded-lg`}>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {connectionStatus === 'disconnected' && (
                  <div className="border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-red-700 dark:text-red-300 font-medium">
                          Connection Issues
                        </span>
                      </div>
                      <Button 
                        onClick={retryConnection}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    </div>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      The AI assistant service appears to be offline. Please ensure all services are running.
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      <strong>Tip:</strong> If you're using Docker, run: <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">docker-compose up -d</code>
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about tactics, player performance, or match predictions..."
                    className="flex-1 resize-none"
                    rows={2}
                    disabled={isLoading || connectionStatus === 'disconnected'}
                  />
                    
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || connectionStatus === 'disconnected'}
                    className="self-end h-14 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Analytics Controls */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex gap-2">
                    <Button 
                      variant={analyticsView === 'overview' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setAnalyticsView('overview')}
                      className="flex items-center gap-1"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Overview
                    </Button>
                    <Button 
                      variant={analyticsView === 'players' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setAnalyticsView('players')}
                      className="flex items-center gap-1"
                    >
                      <Users className="h-4 w-4" />
                      Players
                    </Button>
                    <Button 
                      variant={analyticsView === 'formations' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setAnalyticsView('formations')}
                      className="flex items-center gap-1"
                    >
                      <Target className="h-4 w-4" />
                      Formations
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative">
                      <select 
                        value={analyticsFilter}
                        onChange={(e) => setAnalyticsFilter(e.target.value)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          theme === 'dark' || theme === 'midnight'
                            ? 'bg-gray-800 border-gray-700 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="all">All Data</option>
                        <option value="recent">Last 30 Days</option>
                        <option value="season">This Season</option>
                        <option value="home">Home Matches</option>
                        <option value="away">Away Matches</option>
                      </select>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Scrollable Analytics Content */}
                <div 
                  ref={analyticsContainerRef}
                  className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
                >
                  {analyticsView === 'overview' && (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>Win Probability</p>
                                <p className="text-2xl font-bold text-green-500">72%</p>
                              </div>
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                              </div>
                            </div>
                            <p className={`text-xs mt-2 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>+5% from last match</p>
                          </CardContent>
                        </Card>
                        
                        <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>Formation Efficiency</p>
                                <p className="text-2xl font-bold text-blue-500">85%</p>
                              </div>
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Target className="h-5 w-5 text-blue-500" />
                              </div>
                            </div>
                            <p className={`text-xs mt-2 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>4-3-3 formation performing well</p>
                          </CardContent>
                        </Card>
                        
                        <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>Pressing Intensity</p>
                                <p className="text-2xl font-bold text-yellow-500">68%</p>
                              </div>
                              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <Zap className="h-5 w-5 text-yellow-500" />
                              </div>
                            </div>
                            <p className={`text-xs mt-2 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>Moderate pressure applied</p>
                          </CardContent>
                        </Card>
                        
                        <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>Counter Attack</p>
                                <p className="text-2xl font-bold text-purple-500">91%</p>
                              </div>
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Activity className="h-5 w-5 text-purple-500" />
                              </div>
                            </div>
                            <p className={`text-xs mt-2 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>High success rate</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Performance Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                          <CardHeader className="pb-2">
                            <CardTitle className={`text-lg ${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'}`}>
                              Team Performance Over Time
                            </CardTitle>
                            <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Goals, assists, and ratings progression
                            </p>
                          </CardHeader>
                          <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsLineChart data={enhancedPerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' || theme === 'midnight' ? '#374151' : '#f0f0f0'} />
                                <XAxis dataKey="month" stroke={theme === 'dark' || theme === 'midnight' ? '#9CA3AF' : '#666'} />
                                <YAxis stroke={theme === 'dark' || theme === 'midnight' ? '#9CA3AF' : '#666'} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                  type="monotone" 
                                  dataKey="goals" 
                                  stroke="#3B82F6" 
                                  strokeWidth={2}
                                  dot={<CustomDot />}
                                  activeDot={{ r: 6 }} 
                                  name="Goals" 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="assists" 
                                  stroke="#10B981" 
                                  strokeWidth={2}
                                  dot={<CustomDot />}
                                  activeDot={{ r: 6 }} 
                                  name="Assists" 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="avgRating" 
                                  stroke="#8B5CF6" 
                                  strokeWidth={2}
                                  dot={<CustomDot />}
                                  activeDot={{ r: 6 }} 
                                  name="Avg Rating" 
                                />
                              </RechartsLineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                        
                        <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                          <CardHeader className="pb-2">
                            <CardTitle className={`text-lg ${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'}`}>
                              Player Efficiency Radar
                            </CardTitle>
                            <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Skills assessment across key metrics
                            </p>
                          </CardHeader>
                          <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={playerEfficiencyData}>
                                <PolarGrid stroke={theme === 'dark' || theme === 'midnight' ? '#374151' : '#f0f0f0'} />
                                <PolarAngleAxis dataKey="name" stroke={theme === 'dark' || theme === 'midnight' ? '#9CA3AF' : '#666'} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={theme === 'dark' || theme === 'midnight' ? '#9CA3AF' : '#666'} />
                                <Radar
                                  name="Efficiency"
                                  dataKey="value"
                                  stroke="#3B82F6"
                                  fill="#3B82F6"
                                  fillOpacity={0.6}
                                />
                                <Tooltip content={<CustomTooltip />} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Key Insights */}
                      <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                        <CardHeader className="pb-2">
                          <CardTitle className={`text-lg ${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'}`}>
                            Key Insights
                          </CardTitle>
                          <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
                            AI-powered tactical recommendations
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {keyInsights.map((insight, index) => (
                              <div 
                                key={index} 
                                className={`p-4 rounded-lg border ${
                                  insight.type === 'positive' 
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                }`}
                              >
                                <div className="flex items-start">
                                  {insight.type === 'positive' ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                  ) : (
                                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                                  )}
                                  <div>
                                    <h4 className={`font-medium ${
                                      insight.type === 'positive' 
                                        ? 'text-green-800 dark:text-green-200' 
                                        : 'text-yellow-800 dark:text-yellow-200'
                                    }`}>
                                      {insight.title}
                                    </h4>
                                    <p className={`text-sm mt-1 ${
                                      insight.type === 'positive' 
                                        ? 'text-green-700 dark:text-green-300' 
                                        : 'text-yellow-700 dark:text-yellow-300'
                                    }`}>
                                      {insight.description}
                                    </p>
                                    <Badge 
                                      variant="secondary" 
                                      className={`mt-2 text-xs ${
                                        insight.impact === 'High' 
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' 
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                      }`}
                                    >
                                      {insight.impact} Impact
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {analyticsView === 'players' && (
                    <div className="space-y-6">
                      {/* Player Performance Scatter Plot */}
                      <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                        <CardHeader className="pb-2">
                          <CardTitle className={`text-lg ${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'}`}>
                            Player Performance Analysis
                          </CardTitle>
                          <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Goals vs Assists with Fitness as Size
                          </p>
                        </CardHeader>
                        <CardContent className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid stroke={theme === 'dark' || theme === 'midnight' ? '#374151' : '#f0f0f0'} />
                              <XAxis 
                                type="number" 
                                dataKey="x" 
                                name="Goals" 
                                stroke={theme === 'dark' || theme === 'midnight' ? '#9CA3AF' : '#666'} 
                                label={{ value: 'Goals', position: 'insideBottom', offset: -5 }} 
                              />
                              <YAxis 
                                type="number" 
                                dataKey="y" 
                                name="Assists" 
                                stroke={theme === 'dark' || theme === 'midnight' ? '#9CA3AF' : '#666'} 
                                label={{ value: 'Assists', angle: -90, position: 'insideLeft' }} 
                              />
                              <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }} 
                                content={<CustomTooltip />} 
                              />
                              <Scatter name="Players" data={playerScatterData} fill="#8884d8">
                                {playerScatterData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={
                                    entry.position === 'ST' ? '#FF6B6B' :
                                    entry.position === 'CM' ? '#4ECDC4' :
                                    entry.position === 'CB' ? '#45B7D1' :
                                    entry.position === 'GK' ? '#96CEB4' : '#FFD166'
                                  } />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      
                      {/* Player Stats Table */}
                      <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                        <CardHeader className="pb-2">
                          <CardTitle className={`text-lg ${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'}`}>
                            Player Statistics
                          </CardTitle>
                          <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Detailed performance metrics
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className={`${theme === 'dark' || theme === 'midnight' ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                                  <th className={`text-left py-2 px-3 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-300' : 'text-gray-700'}`}>Player</th>
                                  <th className={`text-left py-2 px-3 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-300' : 'text-gray-700'}`}>Position</th>
                                  <th className={`text-left py-2 px-3 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-300' : 'text-gray-700'}`}>Goals</th>
                                  <th className={`text-left py-2 px-3 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-300' : 'text-gray-700'}`}>Assists</th>
                                  <th className={`text-left py-2 px-3 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-300' : 'text-gray-700'}`}>Rating</th>
                                  <th className={`text-left py-2 px-3 ${theme === 'dark' || theme === 'midnight' ? 'text-gray-300' : 'text-gray-700'}`}>Form</th>
                                </tr>
                              </thead>
                              <tbody>
                                {playerAnalytics.map((player, index) => (
                                  <tr 
                                    key={index} 
                                    className={`${theme === 'dark' || theme === 'midnight' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} border-b`}
                                  >
                                    <td className="py-3 px-3 font-medium">{player.name}</td>
                                    <td className="py-3 px-3">
                                      <Badge variant="secondary" className="text-xs">
                                        {player.position}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-3">{player.goals}</td>
                                    <td className="py-3 px-3">{player.assists}</td>
                                    <td className="py-3 px-3">{player.rating}</td>
                                    <td className="py-3 px-3">
                                      <Badge 
                                        className={`text-xs ${
                                          player.form === 'excellent' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                                            : player.form === 'good' 
                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' 
                                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                        }`}
                                      >
                                        {player.form}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {analyticsView === 'formations' && (
                    <div className="space-y-6">
                      {/* Formation Effectiveness */}
                      <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                        <CardHeader className="pb-2">
                          <CardTitle className={`text-lg ${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'}`}>
                            Formation Effectiveness
                          </CardTitle>
                          <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Performance metrics by tactical setup
                          </p>
                        </CardHeader>
                        <CardContent className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={formationEffectiveness}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' || theme === 'midnight' ? '#374151' : '#f0f0f0'} />
                              <XAxis dataKey="formation" stroke={theme === 'dark' || theme === 'midnight' ? '#9CA3AF' : '#666'} />
                              <YAxis stroke={theme === 'dark' || theme === 'midnight' ? '#9CA3AF' : '#666'} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="wins" fill="#10B981" name="Wins" />
                              <Bar dataKey="draws" fill="#F59E0B" name="Draws" />
                              <Bar dataKey="losses" fill="#EF4444" name="Losses" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      
                      {/* Tactical Distribution */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                          <CardHeader className="pb-2">
                            <CardTitle className={`text-lg ${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'}`}>
                              Tactical Distribution
                            </CardTitle>
                            <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Focus areas during matches
                            </p>
                          </CardHeader>
                          <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={tacticalDistribution}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent !== undefined ? percent * 100 : 0).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {tacticalDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                        
                        <Card className={`${theme === 'dark' || theme === 'midnight' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg`}>
                          <CardHeader className="pb-2">
                            <CardTitle className={`text-lg ${theme === 'dark' || theme === 'midnight' ? 'text-white' : 'text-gray-900'}`}>
                              Formation Recommendations
                            </CardTitle>
                            <p className={`text-sm ${theme === 'dark' || theme === 'midnight' ? 'text-gray-400' : 'text-gray-500'}`}>
                              AI-powered tactical suggestions
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                                    <Target className="h-5 w-5 text-blue-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-blue-800 dark:text-blue-200">4-3-3 Formation</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">High attacking potential, good for possession play</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center">
                                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                                    <Shield className="h-5 w-5 text-green-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-green-800 dark:text-green-200">5-3-2 Formation</h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">Solid defensively, effective against strong attackers</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center">
                                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                                    <Zap className="h-5 w-5 text-purple-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-purple-800 dark:text-purple-200">4-2-3-1 Formation</h4>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Balanced approach, versatile in all situations</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};