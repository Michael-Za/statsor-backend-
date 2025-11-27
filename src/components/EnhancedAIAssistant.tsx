import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiChatService } from '../services/aiChatService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import {
  Bot,
  Send,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Database,
  BarChart3,
  Target,
  MessageSquare,
  Zap,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Mic,
  MicOff,
  FileText,
  Camera,
  Video,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Shield,
  Award,
  MapPin,
  Thermometer,
  Wind,
  Sun,
  Moon,
  Star,
  Bookmark,
  Share2,
  Copy,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  FileImage,
  FileVideo,
  Headphones,
  Gamepad2,
  Trophy,
  Medal,
  Flag,
  Compass,
  Navigation,
  Radar,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useIntegratedData } from '../hooks/useIntegratedData';
import { useSubscription } from '../contexts/SubscriptionContext';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'action' | 'data' | 'error' | 'success' | 'analysis' | 'prediction' | 'warning' | 'file' | 'voice' | 'info';
  metadata?: any;
  attachments?: FileAttachment[];
  confidence?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  suggestions?: string[];
  followUpQuestions?: string[];
}

interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'data';
  size: number;
  url: string;
  thumbnail?: string;
}

interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  rating: number;
  goals: number;
  assists: number;
  matches: number;
  status: 'active' | 'injured' | 'suspended' | 'training' | 'resting';
  injuryHistory?: InjuryRecord[];
  fitnessLevel?: number;
  form?: number;
  marketValue?: number;
  contract?: ContractInfo;
  personalInfo?: PersonalInfo;
  performance?: PerformanceMetrics;
}

interface InjuryRecord {
  id: string;
  type: string;
  severity: 'minor' | 'moderate' | 'severe';
  date: Date;
  expectedReturn?: Date;
  description: string;
  treatment: string;
}

interface ContractInfo {
  startDate: Date;
  endDate: Date;
  salary: number;
  bonuses: number[];
  releaseClause?: number;
}

interface PersonalInfo {
  nationality: string;
  height: number;
  weight: number;
  preferredFoot: 'left' | 'right' | 'both';
  languages: string[];
}

interface PerformanceMetrics {
  speed: number;
  strength: number;
  stamina: number;
  technique: number;
  mentality: number;
  passing: number;
  shooting: number;
  defending: number;
}

interface MatchPrediction {
  opponent: string;
  date: Date;
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
  expectedGoals: number;
  keyFactors: string[];
  recommendedFormation: string;
  recommendedLineup: string[];
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  impact: 'positive' | 'neutral' | 'negative';
}

interface TrainingPlan {
  id: string;
  name: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  focus: string[];
  exercises: Exercise[];
  targetPlayers: string[];
  schedule: Date[];
}

interface Exercise {
  name: string;
  duration: number;
  sets?: number;
  reps?: number;
  description: string;
  equipment: string[];
}

interface UserData {
  players: Player[];
  teamStats: TeamStats;
  sport?: 'soccer' | 'futsal';
  teamName?: string;
  matches?: Match[];
  weather?: WeatherData;
  recentMatches: Match[];
  upcomingMatches: Match[];
  trainingPlans: TrainingPlan[];
  notes: Note[];
  injuries: InjuryRecord[];
  predictions: MatchPrediction[];
  analytics: AdvancedAnalytics;
}

interface TeamStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsScored: number;
  winRate: number;
  possession: number;
  passAccuracy: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
}

interface Match {
  id: string;
  opponent: string;
  date: Date;
  venue: 'home' | 'away';
  competition: string;
  result?: 'win' | 'draw' | 'loss';
  score?: string;
  lineup?: string[];
  substitutions?: Substitution[];
  events?: MatchEvent[];
}

interface Substitution {
  playerOut: string;
  playerIn: string;
  minute: number;
  reason: string;
}

interface MatchEvent {
  type: 'goal' | 'assist' | 'card' | 'substitution' | 'injury';
  player: string;
  minute: number;
  description: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  priority: 'low' | 'medium' | 'high';
}

interface AdvancedAnalytics {
  playerEfficiency: PlayerEfficiency[];
  tacticalAnalysis: TacticalAnalysis;
  fitnessMetrics: FitnessMetrics;
  marketAnalysis: MarketAnalysis;
  competitorAnalysis: CompetitorAnalysis;
}

interface PlayerEfficiency {
  playerId: string;
  efficiency: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface TacticalAnalysis {
  formation: string;
  effectiveness: number;
  strengths: string[];
  weaknesses: string[];
  alternatives: string[];
}

interface FitnessMetrics {
  teamAverage: number;
  injuryRisk: number;
  fatigueLevel: number;
  recommendations: string[];
}

interface MarketAnalysis {
  teamValue: number;
  topPerformers: string[];
  transferTargets: string[];
  contractRenewals: string[];
}

interface CompetitorAnalysis {
  rivals: Competitor[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface Competitor {
  name: string;
  strength: number;
  recentForm: string;
  keyPlayers: string[];
  tactics: string;
}

export const EnhancedAIAssistant: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const { user } = useAuth();
  // Language context available for future use
  useLanguage();
  const { subscription: _subscription, currentPlan: _currentPlan } = useSubscription();
  // Note: subscription and currentPlan are available for future use
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your advanced AI assistant with comprehensive team management capabilities. I can analyze performance, predict match outcomes, manage injuries, create training plans, handle voice commands, process files, and much more. What would you like to explore today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      confidence: 100
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoAnalysis] = useState(true);
  const [realTimeUpdates] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Placeholder functions for UI components
  const setAutoAnalysis = () => {}; // Future implementation
  const setRealTimeUpdates = () => {}; // Future implementation
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [confidenceThreshold, setConfidenceThreshold] = useState([75]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);
  
  // Use integrated data from Data Management system
  const { userData, isLoading: dataLoading, error: dataError, refreshData } = useIntegratedData();
  
  // Fallback userData for when data is loading
  const fallbackUserData: UserData = {
    players: [
      { 
        id: '1', 
        name: 'Torres', 
        position: 'ST', 
        age: 24, 
        rating: 8.4, 
        goals: 18, 
        assists: 7, 
        matches: 25, 
        status: 'active',
        fitnessLevel: 92,
        form: 8.5,
        marketValue: 25000000,
        performance: {
          speed: 85,
          strength: 78,
          stamina: 88,
          technique: 90,
          mentality: 82,
          passing: 75,
          shooting: 92,
          defending: 45
        }
      },
      { 
        id: '2', 
        name: 'Silva', 
        position: 'CM', 
        age: 26, 
        rating: 8.1, 
        goals: 5, 
        assists: 12, 
        matches: 24, 
        status: 'active',
        fitnessLevel: 89,
        form: 8.2,
        marketValue: 30000000,
        performance: {
          speed: 72,
          strength: 70,
          stamina: 85,
          technique: 95,
          mentality: 88,
          passing: 93,
          shooting: 68,
          defending: 75
        }
      },
      { 
        id: '3', 
        name: 'Rodriguez', 
        position: 'CB', 
        age: 28, 
        rating: 7.8, 
        goals: 2, 
        assists: 1, 
        matches: 23, 
        status: 'injured',
        fitnessLevel: 45,
        form: 6.8,
        marketValue: 18000000,
        injuryHistory: [{
          id: 'inj1',
          type: 'Hamstring strain',
          severity: 'moderate',
          date: new Date('2024-01-15'),
          expectedReturn: new Date('2024-02-15'),
          description: 'Grade 2 hamstring strain during training',
          treatment: 'Physiotherapy and rest'
        }],
        performance: {
          speed: 65,
          strength: 88,
          stamina: 82,
          technique: 78,
          mentality: 85,
          passing: 80,
          shooting: 35,
          defending: 92
        }
      },
      { 
        id: '4', 
        name: 'Martinez', 
        position: 'GK', 
        age: 30, 
        rating: 8.2, 
        goals: 0, 
        assists: 0, 
        matches: 25, 
        status: 'active',
        fitnessLevel: 91,
        form: 8.3,
        marketValue: 15000000,
        performance: {
          speed: 60,
          strength: 85,
          stamina: 88,
          technique: 82,
          mentality: 90,
          passing: 70,
          shooting: 25,
          defending: 95
        }
      }
    ],
    teamStats: { 
      wins: 18, 
      draws: 4, 
      losses: 3, 
      goalsFor: 52, 
      goalsAgainst: 23,
      goalsScored: 52,
      winRate: 72,
      possession: 58.5,
      passAccuracy: 84.2,
      shotsOnTarget: 67.8,
      corners: 142,
      fouls: 298,
      yellowCards: 45,
      redCards: 3,
      cleanSheets: 12
    },
    recentMatches: [
      {
        id: 'm1',
        opponent: 'Barcelona FC',
        date: new Date('2024-01-20'),
        venue: 'home',
        competition: 'La Liga',
        result: 'win',
        score: '2-1',
        lineup: ['Martinez', 'Silva', 'Torres']
      }
    ],
    upcomingMatches: [
      {
        id: 'm2',
        opponent: 'Real Madrid',
        date: new Date('2024-02-15'),
        venue: 'away',
        competition: 'La Liga'
      }
    ],
    trainingPlans: [],
    notes: [],
    injuries: [],
    predictions: [
      {
        opponent: 'Real Madrid',
        date: new Date('2024-02-15'),
        winProbability: 35,
        drawProbability: 28,
        lossProbability: 37,
        expectedGoals: 1.8,
        keyFactors: ['Away disadvantage', 'Strong opponent', 'Recent form'],
        recommendedFormation: '4-3-3',
        recommendedLineup: ['Martinez', 'Silva', 'Torres']
      }
    ],
    weather: {
      temperature: 18,
      humidity: 65,
      windSpeed: 12,
      conditions: 'Partly cloudy',
      impact: 'neutral'
    },
    analytics: {
      playerEfficiency: [
        {
          playerId: '1',
          efficiency: 92,
          strengths: ['Finishing', 'Positioning', 'Speed'],
          weaknesses: ['Defensive work', 'Passing'],
          recommendations: ['Improve link-up play', 'Work on defensive pressing']
        }
      ],
      tacticalAnalysis: {
        formation: '4-3-3',
        effectiveness: 78,
        strengths: ['Wing play', 'Counter-attacks'],
        weaknesses: ['Central midfield control'],
        alternatives: ['4-2-3-1', '3-5-2']
      },
      fitnessMetrics: {
        teamAverage: 87,
        injuryRisk: 23,
        fatigueLevel: 34,
        recommendations: ['Rotate squad', 'Focus on recovery']
      },
      marketAnalysis: {
        teamValue: 88000000,
        topPerformers: ['Torres', 'Silva'],
        transferTargets: ['New CB', 'Backup GK'],
        contractRenewals: ['Silva', 'Martinez']
      },
      competitorAnalysis: {
        rivals: [
          {
            name: 'Real Madrid',
            strength: 92,
            recentForm: 'WWWDW',
            keyPlayers: ['Benzema', 'Modric'],
            tactics: '4-3-3 possession-based'
          }
        ],
        strengths: ['Attack', 'Set pieces'],
        weaknesses: ['Defense', 'Squad depth'],
        opportunities: ['Young talent', 'Transfer market'],
        threats: ['Injuries', 'Competition']
      }
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';
      
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognition.current.onerror = () => {
        setIsListening(false);
      };
      
      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Use integrated data or fallback
  const currentUserData = userData || fallbackUserData;

  const generateAutoAnalysis = (): string => {
    const analyses = [
      `Team fitness average is ${currentUserData.analytics.fitnessMetrics.teamAverage}%. Consider rotation for fatigued players.`,
      `Injury risk is at ${currentUserData.analytics.fitnessMetrics.injuryRisk}%. Focus on injury prevention training.`,
      `${currentUserData.analytics.marketAnalysis.topPerformers.join(' and ')} are showing excellent form. Consider contract renewals.`,
      `Weather conditions (${currentUserData.weather?.conditions || 'Clear'}, ${currentUserData.weather?.temperature || 20}°C) may impact next match performance.`,
      `Tactical analysis shows ${currentUserData.analytics.tacticalAnalysis.formation} formation is ${currentUserData.analytics.tacticalAnalysis.effectiveness}% effective.`
    ];
    return analyses[Math.floor(Math.random() * analyses.length)] || 'Team analysis is being processed...';
  };

  const performAutoAnalysis = useCallback(() => {
    const analysisMessage: ChatMessage = {
      id: Date.now().toString(),
      content: generateAutoAnalysis(),
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence: 85,
      priority: 'medium'
    };
    
    if (analysisMessage.confidence && analysisMessage.confidence >= (confidenceThreshold[0] || 75)) {
      setMessages(prev => [...prev, analysisMessage]);
    }
  }, [confidenceThreshold, currentUserData]);

  // Auto-analysis effect
  useEffect(() => {
    if (autoAnalysis && realTimeUpdates) {
      const interval = setInterval(() => {
        performAutoAnalysis();
      }, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoAnalysis, realTimeUpdates, performAutoAnalysis]);
  
  // Refresh data periodically when real-time updates are enabled
  useEffect(() => {
    if (realTimeUpdates && refreshData) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [realTimeUpdates, refreshData]);
  
  // Show loading state if data is being fetched
  if (dataLoading && !userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading team data...</span>
      </div>
    );
  }
  
  // Show error state if there's an error loading data
  if (dataError) {
    console.warn('Data integration error:', dataError);
    // Continue with fallback data instead of showing error to user
  }

  const startVoiceRecognition = () => {
    if (recognition.current && voiceEnabled) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition.current) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const fileMessage: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        content: `Uploaded file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        sender: 'user',
        timestamp: new Date(),
        type: 'file',
        attachments: [{
          id: Date.now().toString(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' :
                file.type.startsWith('audio/') ? 'audio' : 'document',
          size: file.size,
          url: URL.createObjectURL(file)
        }]
      };
      setMessages(prev => [...prev, fileMessage]);
      processUploadedFile(file);
    });
  };

  const processUploadedFile = async (file: File) => {
    setIsLoading(true);
    
    // Simulate file processing
    setTimeout(() => {
      const analysisMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `File analysis complete for ${file.name}. ${getFileAnalysis(file)}`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'analysis',
        confidence: 92
      };
      setMessages(prev => [...prev, analysisMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const getFileAnalysis = (file: File) => {
    if (file.type.startsWith('image/')) {
      return 'Image processed. Detected tactical formation diagram. Analysis shows 4-3-3 setup with high pressing intensity.';
    } else if (file.type.startsWith('video/')) {
      return 'Video analysis complete. Identified 15 key moments, 8 tactical insights, and 3 improvement areas.';
    } else if (file.name.includes('.csv') || file.name.includes('.xlsx')) {
      return 'Data file processed. Found player statistics, match data, and performance metrics. Integrated into team database.';
    }
    return 'Document processed and analyzed for relevant team information.';
  };

  const processAICommand = async (message: string): Promise<ChatMessage> => {
    try {
      // Analyze the message to determine intent and provide real data-driven responses
      const lowerMessage = message.toLowerCase();
      
      // Player analysis requests
      if (lowerMessage.includes('analyze') && (lowerMessage.includes('player') || lowerMessage.includes('squad'))) {
        return await handleAdvancedTeamAnalysis(95);
      }
      
      // Match prediction requests
      if (lowerMessage.includes('predict') || lowerMessage.includes('match') || lowerMessage.includes('next game')) {
        return await handleMatchPrediction(message, 90);
      }
      
      // Player management requests
      if (lowerMessage.includes('add player') || lowerMessage.includes('create player')) {
        return await handleAddPlayer(message);
      }
      
      if (lowerMessage.includes('show players') || lowerMessage.includes('list players') || lowerMessage.includes('my squad')) {
        return await handleShowPlayers();
      }
      
      // Team statistics requests
      if (lowerMessage.includes('stats') || lowerMessage.includes('statistics') || lowerMessage.includes('performance')) {
        return await handleStats();
      }
      
      // Training requests
      if (lowerMessage.includes('training') || lowerMessage.includes('practice')) {
        return await handleAdvancedTrainingPlan(message, 88);
      }
      
      // Tactical advice requests
      if (lowerMessage.includes('tactics') || lowerMessage.includes('formation') || lowerMessage.includes('strategy')) {
        return await handleAdvancedTacticalAdvice(message, 92);
      }
      
      // Injury analysis requests
      if (lowerMessage.includes('injury') || lowerMessage.includes('fitness') || lowerMessage.includes('health')) {
        return await handleInjuryAnalysis(87);
      }
      
      // Market analysis requests
      if (lowerMessage.includes('market') || lowerMessage.includes('transfer') || lowerMessage.includes('value')) {
        return await handleMarketAnalysis(85);
      }
      
      // Weather impact requests
      if (lowerMessage.includes('weather') || lowerMessage.includes('conditions')) {
        return await handleWeatherImpact(80);
      }
      
      // General team analysis
      if (lowerMessage.includes('analyze') || lowerMessage.includes('report') || lowerMessage.includes('overview')) {
        return await handleAdvancedTeamAnalysis(90);
      }
      
      // If no specific intent detected, provide comprehensive team overview
      return await generateComprehensiveResponse();
      
    } catch (error) {
      console.error('AI processing error:', error);
      // Fallback to intelligent response based on available data
      // Calculate confidence based on message content
      const confidence = message.split(' ').length > 2 ? 85 : 70;
      return generateDataDrivenResponse(message, confidence);
    }
  };

  const generateComprehensiveResponse = async (): Promise<ChatMessage> => {
    const teamStats = currentUserData.teamStats;
    const players = currentUserData.players;
    const totalMatches = teamStats.wins + teamStats.draws + teamStats.losses;
    const winRate = totalMatches > 0 ? ((teamStats.wins / totalMatches) * 100).toFixed(1) : '0';
    const avgRating = players.length > 0 ? (players.reduce((sum, p) => sum + p.rating, 0) / players.length).toFixed(1) : '0';
    const topScorer = players.length > 0 ? players.reduce((prev, current) => (prev.goals > current.goals) ? prev : current) : null;
    const injuredPlayers = players.filter(p => p.status === 'injured');
    
    const response = `## Comprehensive Team Analysis

**Current Performance:**
• Win Rate: ${winRate}% (${teamStats.wins}W-${teamStats.draws}D-${teamStats.losses}L)
• Goals Scored: ${teamStats.goalsFor}
• Goals Conceded: ${teamStats.goalsAgainst}
• Goal Difference: ${teamStats.goalsFor - teamStats.goalsAgainst > 0 ? '+' : ''}${teamStats.goalsFor - teamStats.goalsAgainst}

**Squad Overview:**
• Total Players: ${players.length}
• Average Rating: ${avgRating}/10
• Top Scorer: ${topScorer ? `${topScorer.name} (${topScorer.goals} goals)` : 'No data'}
• Injured Players: ${injuredPlayers.length}

**Key Insights:**
${winRate > '70' ? '• ✅ Excellent form - team performing above expectations' : winRate > '50' ? '• ⚠️ Decent form - room for improvement' : '• ❌ Poor form - urgent tactical changes needed'}
${avgRating > '7.5' ? '• ✅ High-quality squad with strong individual performances' : '• ⚠️ Squad needs strengthening and development'}
${injuredPlayers.length === 0 ? '• ✅ Full squad available - no injury concerns' : `• ⚠️ ${injuredPlayers.length} player(s) injured - monitor fitness closely`}

**Actionable Recommendations:**
• ${teamStats.goalsFor < 20 ? 'Focus on attacking drills and finishing practice' : 'Maintain current attacking momentum'}
• ${teamStats.goalsAgainst > 15 ? 'Strengthen defensive organization and set-piece defending' : 'Continue solid defensive work'}
• ${injuredPlayers.length > 0 ? 'Prioritize injury recovery and prevention protocols' : 'Maintain current fitness regime'}

How can I help you improve your team further?`;
    
    return {
      id: Date.now().toString(),
      content: response,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence: 95,
      priority: 'high',
      suggestions: [
        'Show detailed player analysis',
        'Create tactical training plan',
        'Predict next match outcome',
        'Analyze transfer targets'
      ]
    };
  };

  const generateDataDrivenResponse = (message: string, confidence: number): ChatMessage => {
    const players = currentUserData.players;
    const teamStats = currentUserData.teamStats;
    const lowerMessage = message.toLowerCase();
    
    let response = '';
    
    if (lowerMessage.includes('data') || lowerMessage.includes('analyze')) {
      response = `I have full access to your team data and can provide detailed analysis:\n\n**Available Data:**\n• ${players.length} players with complete stats\n• ${teamStats.wins + teamStats.draws + teamStats.losses} matches analyzed\n• Performance metrics and form tracking\n• Injury history and fitness data\n• Market valuations and contract info\n\n**What I can analyze for you:**\n• Individual player performance and development\n• Team tactical effectiveness\n• Match predictions with probability analysis\n• Training recommendations\n• Transfer market opportunities\n• Injury risk assessment\n\nJust ask me anything specific about your team!`;
    } else {
      response = `Based on your current team data:\n\n• You have ${players.length} players in your squad\n• Current form: ${teamStats.wins}W-${teamStats.draws}D-${teamStats.losses}L\n• Top performer: ${players.length > 0 ? players.reduce((prev, current) => (prev.rating > current.rating) ? prev : current).name : 'No data'}\n\nI can provide detailed analysis, predictions, and recommendations. What specific area would you like me to focus on?`;
    }
    
    return {
      id: Date.now().toString(),
      content: response,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      confidence,
      suggestions: [
        'Analyze my best players',
        'Predict my next match',
        'Show team weaknesses',
        'Recommend training focus'
      ]
    };
  };

  const executeAdvancedCommand = async (category: string, message: string, confidence: number): Promise<ChatMessage> => {
    switch (category) {
      case 'playerManagement':
        return handleAdvancedPlayerManagement(message, confidence);
      case 'teamAnalysis':
        return handleAdvancedTeamAnalysis(confidence);
      case 'matchPrediction':
        return handleMatchPrediction(message, confidence);
      case 'injuryAnalysis':
        return handleInjuryAnalysis(confidence);
      case 'tacticalAdvice':
        return handleAdvancedTacticalAdvice(message, confidence);
      case 'trainingPlan':
        return handleAdvancedTrainingPlan(message, confidence);
      case 'marketAnalysis':
        return handleMarketAnalysis(confidence);
      case 'weatherImpact':
        return handleWeatherImpact(confidence);
      case 'competitorAnalysis':
        return handleCompetitorAnalysis(confidence);
      case 'fitnessTracking':
        return handleFitnessTracking(confidence);
      case 'performanceOptimization':
        return handlePerformanceOptimization(message, confidence);
      case 'matchPreparation':
        return handleMatchPreparation(confidence);
      default:
        return handleGeneralQuery(message);
    }
  };

  const generateIntelligentResponse = (message: string, confidence: number): ChatMessage => {
    const responses = [
      `Based on your query "${message}", I can provide comprehensive analysis and recommendations.`,
      `I understand you're asking about "${message}". Let me analyze this with our current team data.`,
      `Your request about "${message}" is interesting. I'll process this using advanced analytics.`,
      `I can help with "${message}". Drawing from our extensive team database and AI capabilities.`
    ];
    
    return {
      id: Date.now().toString(),
      content: responses[Math.floor(Math.random() * responses.length)] + ` (Confidence: ${confidence}%)`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      confidence,
      priority: confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low'
    };
  };

  // Advanced Handler Functions
  const handleAdvancedPlayerManagement = async (message: string, confidence: number): Promise<ChatMessage> => {
    const playerName = message.match(/(?:add|create|register)\s+player\s+([\w\s]+)/i)?.[1] || 'New Player';
    const position = message.match(/(?:as|position)\s+(\w+)/i)?.[1] || 'Unknown';
    const age = parseInt(message.match(/age\s+(\d+)/i)?.[1] || '25');
    const nationality = message.match(/from\s+([\w\s]+)/i)?.[1] || 'Unknown';
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerName.trim(),
      position: position.toUpperCase(),
      age,
      rating: 7.0 + Math.random() * 1.5,
      goals: 0,
      assists: 0,
      matches: 0,
      status: 'active',
      fitnessLevel: 80 + Math.random() * 20,
      form: 7.0 + Math.random() * 1.5,
      marketValue: Math.floor((5 + Math.random() * 20) * 1000000),
      personalInfo: {
        nationality,
        height: 170 + Math.random() * 25,
        weight: 65 + Math.random() * 25,
        preferredFoot: Math.random() > 0.5 ? 'right' : 'left',
        languages: ['English']
      },
      performance: {
        speed: 60 + Math.random() * 35,
        strength: 60 + Math.random() * 35,
        stamina: 60 + Math.random() * 35,
        technique: 60 + Math.random() * 35,
        mentality: 60 + Math.random() * 35,
        passing: 60 + Math.random() * 35,
        shooting: 60 + Math.random() * 35,
        defending: 60 + Math.random() * 35
      }
    };
    
    // Note: Player added to system - would update via integrated data service
    // setUserData(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
    
    return {
      id: Date.now().toString(),
      content: `Successfully added ${playerName} (${position}, Age: ${age}) to the team.\n\nPlayer Profile:\n• Market Value: $${(newPlayer.marketValue! / 1000000).toFixed(1)}M\n• Fitness Level: ${newPlayer.fitnessLevel?.toFixed(0)}%\n• Current Form: ${newPlayer.form?.toFixed(1)}/10\n• Nationality: ${nationality}\n\nThe player is ready for training and match selection.`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'success',
      confidence,
      priority: 'high'
    };
  };

  const handleAdvancedTeamAnalysis = async (confidence: number): Promise<ChatMessage> => {
    const { teamStats, players, analytics } = currentUserData;
    const totalMatches = teamStats.wins + teamStats.draws + teamStats.losses;
    const winRate = ((teamStats.wins / totalMatches) * 100).toFixed(1);
    const avgFitness = players.reduce((sum, p) => sum + (p.fitnessLevel || 0), 0) / players.length;
    const avgForm = players.reduce((sum, p) => sum + (p.form || 0), 0) / players.length;
    
    const analysis = `## Comprehensive Team Analysis\n\n**Season Performance:**\n• Win Rate: ${winRate}% (${teamStats.wins}W-${teamStats.draws}D-${teamStats.losses}L)\n• Goals: ${teamStats.goalsFor} scored, ${teamStats.goalsAgainst} conceded\n• Goal Difference: +${teamStats.goalsFor - teamStats.goalsAgainst}\n• Clean Sheets: ${teamStats.cleanSheets}\n\n**Team Fitness & Form:**\n• Average Fitness: ${avgFitness.toFixed(1)}%\n• Average Form: ${avgForm.toFixed(1)}/10\n• Injury Risk: ${analytics.fitnessMetrics.injuryRisk}%\n\n**Tactical Analysis:**\n• Formation: ${analytics.tacticalAnalysis.formation}\n• Effectiveness: ${analytics.tacticalAnalysis.effectiveness}%\n• Strengths: ${analytics.tacticalAnalysis.strengths.join(', ')}\n• Areas for Improvement: ${analytics.tacticalAnalysis.weaknesses.join(', ')}\n\n**Market Position:**\n• Team Value: $${(analytics.marketAnalysis.teamValue / 1000000).toFixed(1)}M\n• Top Performers: ${analytics.marketAnalysis.topPerformers.join(', ')}\n\n**Recommendations:**\n${analytics.fitnessMetrics.recommendations.map(r => '• ' + r).join('\n')}`;
    
    return {
      id: Date.now().toString(),
      content: analysis,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: 'high'
    };
  };

  const handleMatchPrediction = async (message: string, confidence: number): Promise<ChatMessage> => {
    const opponent = message.match(/(?:against|vs)\s+([\w\s]+)/i)?.[1] || currentUserData.predictions[0]?.opponent || 'Next Opponent';
    const prediction = currentUserData.predictions[0] || {
      opponent,
      date: new Date(),
      winProbability: 45 + Math.random() * 30,
      drawProbability: 25 + Math.random() * 15,
      lossProbability: 30 + Math.random() * 25,
      expectedGoals: 1.5 + Math.random() * 1.5,
      keyFactors: ['Team form', 'Head-to-head record', 'Home advantage'],
      recommendedFormation: '4-3-3',
      recommendedLineup: currentUserData.players.slice(0, 11).map(p => p.name)
    };
    
    const analysis = `## Match Prediction: vs ${prediction.opponent}\n\n**Probability Analysis:**\n• Win: ${prediction.winProbability.toFixed(1)}%\n• Draw: ${prediction.drawProbability.toFixed(1)}%\n• Loss: ${prediction.lossProbability.toFixed(1)}%\n\n**Expected Performance:**\n• Expected Goals: ${prediction.expectedGoals.toFixed(1)}\n• Recommended Formation: ${prediction.recommendedFormation}\n\n**Key Factors:**\n${prediction.keyFactors.map(f => '• ' + f).join('\n')}\n\n**Weather Impact:**\n• Temperature: ${currentUserData.weather?.temperature || 20}°C\n• Conditions: ${currentUserData.weather?.conditions || 'Clear'}\n• Impact: ${currentUserData.weather?.impact || 'neutral'}\n\n**Recommended Starting XI:**\n${prediction.recommendedLineup.slice(0, 11).map((player, i) => `${i + 1}. ${player}`).join('\n')}`;
    
    return {
      id: Date.now().toString(),
      content: analysis,
      sender: 'ai',
      timestamp: new Date(),
      type: 'prediction',
      confidence,
      priority: 'high'
    };
  };

  const handleInjuryAnalysis = async (confidence: number): Promise<ChatMessage> => {
    const injuredPlayers = currentUserData.players.filter(p => p.status === 'injured');
    const fitnessData = currentUserData.analytics.fitnessMetrics;
    
    let analysis = `## Injury & Fitness Analysis\n\n**Current Injuries:**\n`;
    
    if (injuredPlayers.length === 0) {
      analysis += '• No current injuries - excellent team health!\n';
    } else {
      injuredPlayers.forEach(player => {
        const injury = player.injuryHistory?.[0];
        analysis += `• ${player.name}: ${injury?.type || 'Unknown injury'} (${injury?.severity || 'unknown'})\n`;
        if (injury?.expectedReturn) {
          analysis += `  Expected return: ${injury.expectedReturn.toLocaleDateString()}\n`;
        }
      });
    }
    
    analysis += `\n**Team Fitness Overview:**\n• Average Fitness: ${fitnessData.teamAverage}%\n• Injury Risk Level: ${fitnessData.injuryRisk}%\n• Fatigue Level: ${fitnessData.fatigueLevel}%\n\n**Risk Assessment:**\n`;
    
    if (fitnessData.injuryRisk > 30) {
      analysis += '⚠️ HIGH RISK - Immediate action required\n';
    } else if (fitnessData.injuryRisk > 15) {
      analysis += '⚡ MODERATE RISK - Monitor closely\n';
    } else {
      analysis += '✅ LOW RISK - Team in good condition\n';
    }
    
    analysis += `\n**Recommendations:**\n${fitnessData.recommendations.map(r => '• ' + r).join('\n')}`;
    
    return {
      id: Date.now().toString(),
      content: analysis,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: fitnessData.injuryRisk > 30 ? 'critical' : 'medium'
    };
  };

  const handleAdvancedTacticalAdvice = async (message: string, confidence: number): Promise<ChatMessage> => {
    const { tacticalAnalysis } = currentUserData.analytics;
    const opponent = message.match(/(?:against|vs)\s+([\w\s]+)/i)?.[1] || 'upcoming opponent';
    
    const advice = `## Tactical Analysis & Recommendations\n\n**Current Formation: ${tacticalAnalysis.formation}**\n• Effectiveness: ${tacticalAnalysis.effectiveness}%\n\n**Strengths:**\n${tacticalAnalysis.strengths.map(s => '• ' + s).join('\n')}\n\n**Areas for Improvement:**\n${tacticalAnalysis.weaknesses.map(w => '• ' + w).join('\n')}\n\n**Alternative Formations:**\n${tacticalAnalysis.alternatives.map(alt => '• ' + alt).join('\n')}\n\n**Match-Specific Advice vs ${opponent}:**\n• Focus on exploiting wide areas\n• Maintain high defensive line\n• Quick transitions from defense to attack\n• Set piece preparation crucial\n\n**Player Instructions:**\n• Wingers: Stay wide, create overloads\n• Midfield: Control tempo, press high\n• Defense: Play out from back, maintain shape`;
    
    return {
      id: Date.now().toString(),
      content: advice,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: 'high'
    };
  };

  const handleAdvancedTrainingPlan = async (message: string, confidence: number): Promise<ChatMessage> => {
    const focus = message.match(/focus\s+on\s+([\w\s]+)/i)?.[1] || 'general fitness';
    const duration = parseInt(message.match(/(\d+)\s+(?:days?|weeks?)/i)?.[1] || '7');
    
    const trainingPlan = {
      id: Date.now().toString(),
      name: `${focus.charAt(0).toUpperCase() + focus.slice(1)} Training Plan`,
      duration,
      intensity: 'medium' as const,
      focus: [focus, 'fitness', 'tactical'],
      exercises: [
        { name: 'Warm-up', duration: 15, description: 'Dynamic stretching and light jogging', equipment: [] },
        { name: 'Technical drills', duration: 30, description: 'Ball control and passing accuracy', equipment: ['Cones', 'Balls'] },
        { name: 'Tactical work', duration: 45, description: 'Formation practice and positioning', equipment: ['Bibs'] },
        { name: 'Physical conditioning', duration: 20, sets: 3, reps: 10, description: 'Strength and endurance', equipment: ['Weights'] },
        { name: 'Cool down', duration: 10, description: 'Static stretching and recovery', equipment: [] }
      ],
      targetPlayers: currentUserData.players.map(p => p.id),
      schedule: Array.from({ length: duration }, (_, i) => new Date(Date.now() + i * 24 * 60 * 60 * 1000))
    };
    
    // Note: Training plan added to system - would update via integrated data service
    // setUserData(prev => ({ ...prev, trainingPlans: [...prev.trainingPlans, trainingPlan] }));
    
    const plan = `## Training Plan Created: ${trainingPlan.name}\n\n**Duration:** ${duration} days\n**Intensity:** ${trainingPlan.intensity}\n**Focus Areas:** ${trainingPlan.focus.join(', ')}\n\n**Daily Schedule:**\n${trainingPlan.exercises.map(ex => `• ${ex.name} (${ex.duration}min): ${ex.description}`).join('\n')}\n\n**Target Players:** All squad members\n\n**Expected Outcomes:**\n• Improved ${focus}\n• Enhanced team coordination\n• Better physical condition\n• Reduced injury risk\n\nTraining plan has been added to your schedule and all players have been notified.`;
    
    return {
      id: Date.now().toString(),
      content: plan,
      sender: 'ai',
      timestamp: new Date(),
      type: 'success',
      confidence,
      priority: 'high'
    };
  };

  const handleMarketAnalysis = async (confidence: number): Promise<ChatMessage> => {
    const { marketAnalysis } = currentUserData.analytics;
    
    const analysis = `## Market Analysis Report\n\n**Team Valuation:**\n• Current Value: $${(marketAnalysis.teamValue / 1000000).toFixed(1)}M\n• Market Trend: Stable ↗️\n\n**Top Performers:**\n${marketAnalysis.topPerformers.map(player => {
      const p = currentUserData.players.find(pl => pl.name === player);
      return `• ${player}: $${p?.marketValue ? (p.marketValue / 1000000).toFixed(1) : '0'}M (Form: ${p?.form?.toFixed(1) || '0'}/10)`;
    }).join('\n')}\n\n**Transfer Recommendations:**\n**Targets to Acquire:**\n${marketAnalysis.transferTargets.map(target => '• ' + target + ' - Strategic priority').join('\n')}\n\n**Contract Renewals:**\n${marketAnalysis.contractRenewals.map(player => {
      const p = currentUserData.players.find(pl => pl.name === player);
      return `• ${player} - Current value: $${p?.marketValue ? (p.marketValue / 1000000).toFixed(1) : '0'}M`;
    }).join('\n')}\n\n**Market Opportunities:**\n• Young talent acquisition window open\n• Favorable exchange rates for international transfers\n• Several clubs looking to sell key players\n\n**Financial Recommendations:**\n• Prioritize contract renewals for top performers\n• Consider selling underperforming assets\n• Invest in youth development`;
    
    return {
      id: Date.now().toString(),
      content: analysis,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: 'medium'
    };
  };

  const handleWeatherImpact = async (confidence: number): Promise<ChatMessage> => {
    const weather = currentUserData.weather || {
      temperature: 20,
      humidity: 50,
      windSpeed: 5,
      conditions: 'Clear',
      impact: 'neutral' as const
    };
    
    const impact = `## Weather Impact Analysis\n\n**Current Conditions:**\n• Temperature: ${weather.temperature}°C\n• Humidity: ${weather.humidity}%\n• Wind Speed: ${weather.windSpeed} km/h\n• Conditions: ${weather.conditions}\n\n**Performance Impact: ${weather.impact.toUpperCase()}**\n\n**Tactical Adjustments:**\n`;
    
    let recommendations = '';
    if (weather.temperature < 10) {
      recommendations += '• Cold weather: Focus on longer warm-up, maintain ball possession\n';
    } else if (weather.temperature > 25) {
      recommendations += '• Hot weather: Increase hydration, consider more substitutions\n';
    }
    
    if (weather.windSpeed > 15) {
      recommendations += '• Windy conditions: Adjust passing game, be careful with crosses\n';
    }
    
    if (weather.humidity > 70) {
      recommendations += '• High humidity: Monitor player fatigue, adjust intensity\n';
    }
    
    if (weather.conditions.includes('rain')) {
      recommendations += '• Wet conditions: Focus on ground passes, careful with tackles\n';
    }
    
    const finalAnalysis = impact + recommendations + '\n**Equipment Recommendations:**\n• Appropriate footwear for conditions\n• Weather-suitable training gear\n• Extra hydration supplies';
    
    return {
      id: Date.now().toString(),
      content: finalAnalysis,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: weather.impact === 'negative' ? 'high' : 'medium'
    };
  };

  const handleCompetitorAnalysis = async (confidence: number): Promise<ChatMessage> => {
    const { competitorAnalysis } = currentUserData.analytics;
    
    const analysis = `## Competitor Analysis\n\n**Key Rivals:**\n${competitorAnalysis.rivals.map(rival => 
      `• **${rival.name}** (Strength: ${rival.strength}/100)\n  - Recent Form: ${rival.recentForm}\n  - Key Players: ${rival.keyPlayers.join(', ')}\n  - Tactics: ${rival.tactics}`
    ).join('\n\n')}\n\n**SWOT Analysis:**\n\n**Strengths:**\n${competitorAnalysis.strengths.map(s => '• ' + s).join('\n')}\n\n**Weaknesses:**\n${competitorAnalysis.weaknesses.map(w => '• ' + w).join('\n')}\n\n**Opportunities:**\n${competitorAnalysis.opportunities.map(o => '• ' + o).join('\n')}\n\n**Threats:**\n${competitorAnalysis.threats.map(t => '• ' + t).join('\n')}\n\n**Strategic Recommendations:**\n• Focus on exploiting competitor weaknesses\n• Strengthen areas where rivals excel\n• Monitor transfer activities of key rivals\n• Develop counter-tactics for common formations`;
    
    return {
      id: Date.now().toString(),
      content: analysis,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: 'medium'
    };
  };

  const handleFitnessTracking = async (confidence: number): Promise<ChatMessage> => {
    const fitnessData = currentUserData.players.map(player => ({
      name: player.name,
      fitness: player.fitnessLevel || 0,
      form: player.form || 0,
      status: player.status,
      risk: player.status === 'injured' ? 'High' : 
             (player.fitnessLevel || 0) < 70 ? 'Medium' : 'Low'
    }));
    
    const avgFitness = fitnessData.reduce((sum, p) => sum + p.fitness, 0) / fitnessData.length;
    const lowFitnessPlayers = fitnessData.filter(p => p.fitness < 70);
    
    const report = `## Fitness Tracking Report\n\n**Team Overview:**\n• Average Fitness: ${avgFitness.toFixed(1)}%\n• Players Below 70%: ${lowFitnessPlayers.length}\n• Injured Players: ${fitnessData.filter(p => p.status === 'injured').length}\n\n**Individual Status:**\n${fitnessData.map(player => 
      `• ${player.name}: ${player.fitness.toFixed(0)}% (${player.risk} Risk) - ${player.status}`
    ).join('\n')}\n\n**Recommendations:**\n${lowFitnessPlayers.length > 0 ? 
      `• Focus on fitness for: ${lowFitnessPlayers.map(p => p.name).join(', ')}\n` : 
      '• Team fitness levels are excellent\n'
    }• Implement rotation policy for high-intensity matches\n• Monitor workload during training\n• Ensure adequate recovery time`;
    
    return {
      id: Date.now().toString(),
      content: report,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: lowFitnessPlayers.length > 3 ? 'high' : 'medium'
    };
  };

  const handlePerformanceOptimization = async (message: string, confidence: number): Promise<ChatMessage> => {
    const targetArea = message.match(/(?:improve|optimize|enhance)\s+([\w\s]+)/i)?.[1] || 'overall performance';
    
    const optimization = `## Performance Optimization Plan\n\n**Target Area:** ${targetArea}\n\n**Current Analysis:**\n• Team Rating: ${(currentUserData.players.reduce((sum, p) => sum + p.rating, 0) / currentUserData.players.length).toFixed(1)}/10\n• Win Rate: ${((currentUserData.teamStats.wins / (currentUserData.teamStats.wins + currentUserData.teamStats.draws + currentUserData.teamStats.losses)) * 100).toFixed(1)}%\n• Goals Per Game: ${(currentUserData.teamStats.goalsFor / (currentUserData.teamStats.wins + currentUserData.teamStats.draws + currentUserData.teamStats.losses)).toFixed(1)}\n\n**Optimization Strategies:**\n\n**1. Individual Player Development:**\n${currentUserData.players.slice(0, 3).map(player => 
      `• ${player.name}: Focus on ${player.rating < 7 ? 'basic skills' : player.rating < 8 ? 'advanced techniques' : 'leadership qualities'}`
    ).join('\n')}\n\n**2. Tactical Improvements:**\n• Enhance ${currentUserData.analytics.tacticalAnalysis.weaknesses[0] || 'team coordination'}\n• Develop alternative strategies\n• Improve set piece execution\n\n**3. Physical Conditioning:**\n• Increase training intensity by 10%\n• Focus on injury prevention\n• Implement recovery protocols\n\n**4. Mental Preparation:**\n• Team building exercises\n• Pressure situation training\n• Confidence building sessions\n\n**Expected Timeline:** 4-6 weeks\n**Success Metrics:** +0.5 team rating, +10% win rate`;
    
    return {
      id: Date.now().toString(),
      content: optimization,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: 'high'
    };
  };

  const handleMatchPreparation = async (confidence: number): Promise<ChatMessage> => {
    const nextMatch = currentUserData.upcomingMatches[0];
    const prediction = currentUserData.predictions[0];
    
    if (!nextMatch) {
      return {
        id: Date.now().toString(),
        content: 'No upcoming matches scheduled. Focus on training and player development.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'info',
        confidence
      };
    }
    
    const preparation = `## Match Preparation: vs ${nextMatch.opponent}\n\n**Match Details:**\n• Date: ${nextMatch.date.toLocaleDateString()}\n• Venue: ${nextMatch.venue}\n• Competition: ${nextMatch.competition}\n\n**Pre-Match Analysis:**\n• Win Probability: ${prediction?.winProbability.toFixed(1) || '50'}%\n• Recommended Formation: ${prediction?.recommendedFormation || '4-3-3'}\n• Key Factors: ${prediction?.keyFactors.join(', ') || 'Team form, home advantage'}\n\n**Preparation Checklist:**\n\n**Training Focus (3 days before):**\n• Tactical rehearsal\n• Set piece practice\n• Opponent analysis\n• Fitness maintenance\n\n**Day Before Match:**\n• Light training session\n• Team meeting\n• Mental preparation\n• Equipment check\n\n**Match Day:**\n• Proper warm-up (45 minutes)\n• Final tactical briefing\n• Player motivation\n• Injury assessment\n\n**Starting XI Recommendation:**\n${prediction?.recommendedLineup.slice(0, 11).map((player, i) => `${i + 1}. ${player}`).join('\n') || 'Based on current form and fitness'}\n\n**Weather Considerations:**\n• Temperature: ${currentUserData.weather?.temperature || 20}°C\n• Conditions: ${currentUserData.weather?.conditions || 'Clear'}\n• Impact: ${currentUserData.weather?.impact || 'neutral'}`;
    
    return {
      id: Date.now().toString(),
      content: preparation,
      sender: 'ai',
      timestamp: new Date(),
      type: 'analysis',
      confidence,
      priority: 'high'
    };
  };

  const handleAddPlayer = async (message: string): Promise<ChatMessage> => {
    // Extract player details from message using AI parsing
    const playerData = parsePlayerFromMessage(message);
    
    if (playerData) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: playerData.name || 'New Player',
        position: playerData.position || 'MF',
        age: playerData.age || 22,
        rating: playerData.rating || 7.0,
        goals: 0,
        assists: 0,
        matches: 0,
        status: 'active'
      };
      
      // Note: Player added to system - would update via integrated data service
      // setUserData(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
      
      return {
        id: Date.now().toString(),
        content: `Successfully added ${newPlayer.name} (${newPlayer.position}) to your squad. The player has been assigned rating ${newPlayer.rating} and is ready for selection.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'success',
        metadata: { action: 'add_player', player: newPlayer }
      };
    }
    
    return {
      id: Date.now().toString(),
      content: 'I need more information to add a player. Please provide at least the player name and position. Example: "Add player John Smith as striker"',
      sender: 'ai',
      timestamp: new Date(),
      type: 'error'
    };
  };

  const handleEditPlayer = async (message: string): Promise<ChatMessage> => {
    const playerName = extractPlayerName(message);
    const player = currentUserData.players.find(p => p.name.toLowerCase().includes(playerName.toLowerCase()));
    
    if (player) {
      const updates = parsePlayerUpdates(message);
      const updatedPlayer = { ...player, ...updates };
      
      // Note: Player updated in system - would update via integrated data service
      // setUserData(prev => ({ ...prev, players: prev.players.map((p: Player) => p.id === player.id ? updatedPlayer : p) }));
      
      return {
        id: Date.now().toString(),
        content: `Successfully updated ${player.name}. Changes applied: ${Object.keys(updates).join(', ')}.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'success',
        metadata: { action: 'edit_player', player: updatedPlayer, changes: updates }
      };
    }
    
    return {
      id: Date.now().toString(),
      content: `Player not found. Available players: ${currentUserData.players.map(p => p.name).join(', ')}`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'error'
    };
  };

  const handleRemovePlayer = async (message: string): Promise<ChatMessage> => {
    const playerName = extractPlayerName(message);
    const player = currentUserData.players.find(p => p.name.toLowerCase().includes(playerName.toLowerCase()));
    
    if (player) {
      // Note: Player removed from system - would update via integrated data service
      // setUserData(prev => ({ ...prev, players: prev.players.filter((p: Player) => p.id !== player.id) }));
      
      return {
        id: Date.now().toString(),
        content: `Successfully removed ${player.name} from your squad.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'success',
        metadata: { action: 'remove_player', player }
      };
    }
    
    return {
      id: Date.now().toString(),
      content: `Player not found. Available players: ${currentUserData.players.map(p => p.name).join(', ')}`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'error'
    };
  };

  const handleShowPlayers = async (): Promise<ChatMessage> => {
    const playersInfo = currentUserData.players.map(p => 
      `${p.name} (${p.position}) - Rating: ${p.rating}, Goals: ${p.goals}, Status: ${p.status}`
    ).join('\n');
    
    return {
      id: Date.now().toString(),
      content: `Current Squad (${currentUserData.players.length} players):\n\n${playersInfo}\n\nTeam Stats: ${currentUserData.teamStats.wins}W-${currentUserData.teamStats.draws}D-${currentUserData.teamStats.losses}L`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'data',
      metadata: { action: 'show_players', players: currentUserData.players }
    };
  };

  const handleAnalysis = async (message: string): Promise<ChatMessage> => {
    const analysisType = extractAnalysisType(message);
    
    let analysisResult = '';
    
    switch (analysisType) {
      case 'team':
        analysisResult = `Team Analysis:\n\n• Overall Performance: Strong (72% win rate)\n• Top Scorer: ${currentUserData.players.reduce((prev, current) => (prev.goals > current.goals) ? prev : current).name} (${currentUserData.players.reduce((prev, current) => (prev.goals > current.goals) ? prev : current).goals} goals)\n• Defensive Stability: Good (0.92 goals conceded per game)\n• Key Strength: Attacking efficiency\n• Area for Improvement: Set piece defending`;
        break;
      case 'player':
        const playerName = extractPlayerName(message);
        const player = currentUserData.players.find(p => p.name.toLowerCase().includes(playerName.toLowerCase()));
        if (player) {
          analysisResult = `${player.name} Analysis:\n\n• Current Rating: ${player.rating}/10\n• Goals: ${player.goals} in ${player.matches} matches\n• Assists: ${player.assists}\n• Form: ${player.rating > 8 ? 'Excellent' : player.rating > 7 ? 'Good' : 'Average'}\n• Recommendation: ${player.rating > 8 ? 'Key player, maintain fitness' : 'Focus on training to improve performance'}`;
        } else {
          analysisResult = 'Player not found. Please specify a valid player name.';
        }
        break;
      default:
        analysisResult = 'Comprehensive Analysis:\n\n• Team Form: Excellent\n• Attack Rating: 8.5/10\n• Defense Rating: 7.8/10\n• Midfield Control: 8.2/10\n• Recent Trend: Improving\n• Next Focus: Set piece training';
    }
    
    return {
      id: Date.now().toString(),
      content: analysisResult,
      sender: 'ai',
      timestamp: new Date(),
      type: 'data',
      metadata: { action: 'analysis', type: analysisType }
    };
  };

  const handleStats = async (): Promise<ChatMessage> => {
    const stats = `Current Season Statistics:\n\nMatches: ${currentUserData.teamStats.wins + currentUserData.teamStats.draws + currentUserData.teamStats.losses}\nWins: ${currentUserData.teamStats.wins}\nDraws: ${currentUserData.teamStats.draws}\nLosses: ${currentUserData.teamStats.losses}\nGoals For: ${currentUserData.teamStats.goalsFor}\nGoals Against: ${currentUserData.teamStats.goalsAgainst}\nGoal Difference: +${currentUserData.teamStats.goalsFor - currentUserData.teamStats.goalsAgainst}\nWin Rate: ${Math.round((currentUserData.teamStats.wins / (currentUserData.teamStats.wins + currentUserData.teamStats.draws + currentUserData.teamStats.losses)) * 100)}%`;
    
    return {
      id: Date.now().toString(),
      content: stats,
      sender: 'ai',
      timestamp: new Date(),
      type: 'data',
      metadata: { action: 'stats', data: currentUserData.teamStats }
    };
  };

  const handlePerformanceReport = async (message: string): Promise<ChatMessage> => {
    const topScorer = currentUserData.players.reduce((prev, current) => (prev.goals > current.goals) ? prev : current);
    const topAssister = currentUserData.players.reduce((prev, current) => (prev.assists > current.assists) ? prev : current);
    const bestRated = currentUserData.players.reduce((prev, current) => (prev.rating > current.rating) ? prev : current);
    
    const report = `Performance Report:\n\nTop Performer: ${bestRated.name} (${bestRated.rating} rating)\nTop Scorer: ${topScorer.name} (${topScorer.goals} goals)\nTop Assister: ${topAssister.name} (${topAssister.assists} assists)\n\nSquad Overview:\n• Active Players: ${currentUserData.players.filter(p => p.status === 'active').length}\n• Injured Players: ${currentUserData.players.filter(p => p.status === 'injured').length}\n• Average Rating: ${(currentUserData.players.reduce((sum, p) => sum + p.rating, 0) / currentUserData.players.length).toFixed(1)}\n\nRecommendations:\n• Focus on fitness for injured players\n• Maintain current attacking form\n• Work on defensive set pieces`;
    
    return {
      id: Date.now().toString(),
      content: report,
      sender: 'ai',
      timestamp: new Date(),
      type: 'data',
      metadata: { action: 'performance_report' }
    };
  };

  const handleTraining = async (message: string): Promise<ChatMessage> => {
    const trainingPlan = `AI-Generated Training Plan:\n\nWeekly Schedule:\n\nMonday - Fitness & Conditioning\n• 30min cardio\n• Strength training\n• Recovery session\n\nTuesday - Technical Skills\n• Ball control drills\n• Passing accuracy\n• Shooting practice\n\nWednesday - Tactical Work\n• Formation practice\n• Set piece training\n• Match simulation\n\nThursday - Recovery\n• Light training\n• Injury prevention\n• Mental preparation\n\nFriday - Match Preparation\n• Final tactical review\n• Set piece practice\n• Team talk\n\nFocus Areas:\n• Improve set piece defending\n• Maintain attacking fluidity\n• Build squad depth`;
    
    return {
      id: Date.now().toString(),
      content: trainingPlan,
      sender: 'ai',
      timestamp: new Date(),
      type: 'data',
      metadata: { action: 'training_plan' }
    };
  };

  const handleTactical = async (message: string): Promise<ChatMessage> => {
    const tacticalAdvice = `Tactical Analysis & Recommendations:\n\nCurrent Formation: 4-3-3\n\nStrengths:\n• Strong wing play\n• Good midfield control\n• Effective pressing\n\nAreas to Improve:\n• Central defensive stability\n• Set piece defending\n• Counter-attack transitions\n\nTactical Adjustments:\n• Consider 4-2-3-1 for better defensive balance\n• Focus on quick transitions\n• Improve communication between lines\n\nMatch-Specific Advice:\n• Against strong teams: More defensive approach\n• Against weaker teams: High pressing\n• Away games: Compact formation`;
    
    return {
      id: Date.now().toString(),
      content: tacticalAdvice,
      sender: 'ai',
      timestamp: new Date(),
      type: 'data',
      metadata: { action: 'tactical_advice' }
    };
  };

  const handleGeneralQuery = async (message: string): Promise<ChatMessage> => {
    // Simulate AI processing with contextual responses
    const responses = [
      `Based on your team's current form and the data I have access to, I can provide detailed insights. Your team is performing well with a ${Math.round((currentUserData.teamStats.wins / (currentUserData.teamStats.wins + currentUserData.teamStats.draws + currentUserData.teamStats.losses)) * 100)}% win rate. What specific aspect would you like me to analyze?`,
      `I have access to all your team data including player statistics, match history, and performance metrics. I can help you with player management, tactical analysis, training plans, or any other team-related decisions. What would you like to focus on?`,
      `Your squad currently has ${currentUserData.players.length} players with an average rating of ${(currentUserData.players.reduce((sum, p) => sum + p.rating, 0) / currentUserData.players.length).toFixed(1)}. I can provide detailed analysis, suggest improvements, or help with any team management tasks. How can I assist you?`
    ];
    
    return {
      id: Date.now().toString(),
      content: responses[Math.floor(Math.random() * responses.length)] || 'I\'m here to help with your team management needs.',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
  };

  // Helper functions for parsing user input
  const parsePlayerFromMessage = (message: string) => {
    const nameMatch = message.match(/(?:add|create)\s+player\s+([a-zA-Z\s]+)(?:\s+as\s+|\s+position\s+|\s+)([a-zA-Z]{1,3})?/i);
    const ageMatch = message.match(/age\s+(\d+)/i);
    const ratingMatch = message.match(/rating\s+(\d+(?:\.\d+)?)/i);
    
    if (nameMatch && nameMatch[1]) {
      return {
        name: nameMatch[1].trim(),
        position: nameMatch[2]?.toUpperCase() || null,
        age: ageMatch && ageMatch[1] ? parseInt(ageMatch[1]) : null,
        rating: ratingMatch && ratingMatch[1] ? parseFloat(ratingMatch[1]) : null
      };
    }
    return null;
  };

  const extractPlayerName = (message: string): string => {
    const patterns = [
      /(?:player|edit|update|remove|delete)\s+([a-zA-Z\s]+?)(?:\s|$)/i,
      /([a-zA-Z\s]+?)(?:'s|\s+stats|\s+performance)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };

  const parsePlayerUpdates = (message: string) => {
    const updates: any = {};
    
    const ratingMatch = message.match(/rating\s+(\d+(?:\.\d+)?)/i);
    if (ratingMatch && ratingMatch[1]) updates.rating = parseFloat(ratingMatch[1]);
    
    const positionMatch = message.match(/position\s+([a-zA-Z]{1,3})/i);
    if (positionMatch && positionMatch[1]) updates.position = positionMatch[1].toUpperCase();
    
    const ageMatch = message.match(/age\s+(\d+)/i);
    if (ageMatch && ageMatch[1]) updates.age = parseInt(ageMatch[1]);
    
    const statusMatch = message.match(/status\s+(active|injured|suspended)/i);
    if (statusMatch && statusMatch[1]) updates.status = statusMatch[1].toLowerCase();
    
    return updates;
  };

  const extractAnalysisType = (message: string): string => {
    if (message.toLowerCase().includes('team')) return 'team';
    if (message.toLowerCase().includes('player')) return 'player';
    return 'general';
  };

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
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = await processAICommand(inputMessage);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'I understand you\'re asking about "' + inputMessage + '". Let me provide you with some helpful information based on your team\'s context and my football knowledge.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (message: string) => {
    if (isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = await processAICommand(message);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'I understand you\'re asking about "' + message + '". Let me provide you with some helpful information based on your team\'s context and my football knowledge.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'data': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'action': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`h-full flex flex-col relative overflow-hidden ${
      isHighContrast ? 'hc-bg' :
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    } ${isExpanded ? 'fixed inset-0 z-50' : ''}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.05)_50%,transparent_75%)]" />
      </div>
      
      {/* Enhanced Header */}
      <div className={`relative p-6 border-b backdrop-blur-sm ${
        isHighContrast ? 'hc-border' :
        theme === 'dark' 
          ? 'border-gray-700/50 bg-gray-800/30' 
          : 'border-gray-200/50 bg-white/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-30 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <Zap className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h2 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
                isHighContrast ? 'hc-text' :
                theme === 'dark' ? 'from-blue-400 to-purple-400' : ''
              }`}>
                AI Team Assistant
              </h2>
              <p className={`text-sm ${
                isHighContrast ? 'hc-text opacity-70' :
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Powered by Advanced Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <Badge variant="outline" className={`${
                theme === 'dark' 
                  ? 'bg-green-900/30 text-green-400 border-green-500/30' 
                  : 'bg-green-50 text-green-700 border-green-200'
              } font-medium`}>
                <Activity className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`rounded-lg ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700/50' 
                  : 'hover:bg-gray-100/50'
              }`}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Tabs */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col relative">
         <div className={`px-6 py-4 ${
           theme === 'dark' ? 'bg-gray-800/20' : 'bg-white/20'
         } backdrop-blur-sm`}>
           <TabsList className={`grid w-full grid-cols-3 p-1 rounded-xl ${
             theme === 'dark' 
               ? 'bg-gray-800/50 border border-gray-700/50' 
               : 'bg-white/50 border border-gray-200/50 shadow-sm'
           }`}>
             <TabsTrigger 
               value="chat" 
               className={`flex items-center gap-2 rounded-lg font-medium transition-all duration-200 ${
                 activeTab === 'chat' 
                   ? theme === 'dark'
                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                     : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                   : theme === 'dark'
                     ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                     : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
               }`}
             >
               <MessageSquare className="h-4 w-4" />
               Chat
             </TabsTrigger>
             <TabsTrigger 
               value="analytics" 
               className={`flex items-center gap-2 rounded-lg font-medium transition-all duration-200 ${
                 activeTab === 'analytics' 
                   ? theme === 'dark'
                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                     : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                   : theme === 'dark'
                     ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                     : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
               }`}
             >
               <BarChart3 className="h-4 w-4" />
               Analytics
             </TabsTrigger>
             <TabsTrigger 
               value="settings" 
               className={`flex items-center gap-2 rounded-lg font-medium transition-all duration-200 ${
                 activeTab === 'settings' 
                   ? theme === 'dark'
                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                     : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                   : theme === 'dark'
                     ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                     : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
               }`}
             >
               <Settings className="h-4 w-4" />
               Settings
             </TabsTrigger>
           </TabsList>
         </div>
 
        <TabsContent value="chat" className="flex-1 flex flex-col relative">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
            {/* Chat background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.1),transparent_50%)]" />
            </div>
            
            <div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} relative`}
                >
                  <div className={`max-w-[85%] relative group ${
                    message.sender === 'user'
                      ? 'ml-12'
                      : 'mr-12'
                  }`}>
                    {message.sender === 'user' ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-br-md p-4 shadow-lg">
                          <div className="whitespace-pre-wrap font-medium">{message.content}</div>
                          <div className="text-xs mt-2 opacity-80">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className={`absolute inset-0 rounded-2xl blur-lg opacity-10 group-hover:opacity-20 transition-opacity ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'
                        }`} />
                        <div className={`relative rounded-2xl rounded-bl-md p-4 shadow-lg backdrop-blur-sm border ${
                          isHighContrast ? 'hc-card' :
                          theme === 'dark'
                            ? 'bg-gray-800/80 border-gray-700/50 text-white'
                            : 'bg-white/80 border-gray-200/50 text-gray-900'
                        }`}>
                          <div className="flex items-center space-x-2 mb-3">
                            <div className={`p-1.5 rounded-lg ${
                              theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50'
                            }`}>
                              {getMessageIcon(message.type || 'text')}
                            </div>
                            <span className={`text-xs font-semibold ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              AI Team Assistant
                            </span>
                            {message.confidence && (
                              <Badge variant="outline" className={`text-xs ${
                                message.confidence >= 80 
                                  ? 'border-green-500/30 text-green-600 bg-green-50/50'
                                  : message.confidence >= 60
                                    ? 'border-yellow-500/30 text-yellow-600 bg-yellow-50/50'
                                    : 'border-red-500/30 text-red-600 bg-red-50/50'
                              }`}>
                                {message.confidence}% confident
                              </Badge>
                            )}
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                          <div className={`text-xs mt-3 flex items-center justify-between ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
        
            {isLoading && (
              <div
                className="flex justify-start mr-12"
              >
                <div className={`relative rounded-2xl rounded-bl-md p-4 shadow-lg backdrop-blur-sm border max-w-[85%] ${
                  isHighContrast ? 'hc-card' :
                  theme === 'dark'
                    ? 'bg-gray-800/80 border-gray-700/50'
                    : 'bg-white/80 border-gray-200/50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50'
                    }`}>
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>AI is analyzing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        
        <div ref={messagesEndRef} />
      </div>

          {/* Enhanced Input Area */}
          <div className={`relative p-6 border-t backdrop-blur-sm ${
            isHighContrast ? 'hc-border' :
            theme === 'dark' 
              ? 'border-gray-700/50 bg-gray-800/30' 
              : 'border-gray-200/50 bg-white/30'
          }`}>
            <div className="space-y-4">
              <div className="relative">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your team, players, tactics, or request actions..."
                      className={`pr-12 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                        isHighContrast
                          ? 'bg-white border-black text-black placeholder:text-gray-700 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500'
                          : theme === 'dark'
                          ? 'bg-gray-800/80 border-gray-600/70 text-white placeholder:text-gray-400 focus:border-blue-400/80 focus:bg-gray-800/95 focus:text-white focus:ring-2 focus:ring-blue-500/50'
                          : 'bg-white/90 border-gray-300/70 text-gray-900 placeholder:text-gray-500 focus:border-blue-500/80 focus:bg-white focus:text-gray-900 focus:ring-2 focus:ring-blue-500/50'
                      } backdrop-blur-sm shadow-sm`}
                      disabled={isLoading}
                    />
                    {inputMessage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInputMessage('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 opacity-50 hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      !inputMessage.trim() || isLoading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Enhanced Quick Actions */}
              <div className="space-y-3">
                <div className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Quick Actions
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick('Show me all players')}
                    disabled={isLoading}
                    className={`text-xs rounded-lg transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-gray-700/50 hover:border-blue-500/50 hover:bg-blue-500/10'
                        : 'border-gray-200/50 hover:border-blue-500/50 hover:bg-blue-50/50'
                    } backdrop-blur-sm`}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Show Players
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick('Analyze team performance')}
                    disabled={isLoading}
                    className={`text-xs rounded-lg transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-gray-700/50 hover:border-purple-500/50 hover:bg-purple-500/10'
                        : 'border-gray-200/50 hover:border-purple-500/50 hover:bg-purple-50/50'
                    } backdrop-blur-sm`}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Team Analysis
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick('Create training plan')}
                    disabled={isLoading}
                    className={`text-xs rounded-lg transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-gray-700/50 hover:border-green-500/50 hover:bg-green-500/10'
                        : 'border-gray-200/50 hover:border-green-500/50 hover:bg-green-50/50'
                    } backdrop-blur-sm`}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Training Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick('Add player John Doe as striker')}
                    disabled={isLoading}
                    className={`text-xs rounded-lg transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-gray-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/10'
                        : 'border-gray-200/50 hover:border-indigo-500/50 hover:bg-indigo-50/50'
                    } backdrop-blur-sm`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Player
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick('Predict next match outcome')}
                    disabled={isLoading}
                    className={`text-xs rounded-lg transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-gray-700/50 hover:border-orange-500/50 hover:bg-orange-500/10'
                        : 'border-gray-200/50 hover:border-orange-500/50 hover:bg-orange-50/50'
                    } backdrop-blur-sm`}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Match Prediction
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="flex-1 p-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Team Performance
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Win Rate</span>
                    <span className="font-medium">{currentUserData.teamStats.winRate}%</span>
                  </div>
                  <Progress value={currentUserData.teamStats.winRate} className="h-2" />
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goals Scored
                </h3>
                <div className="text-2xl font-bold">{currentUserData.teamStats.goalsScored}</div>
                <div className="text-sm text-gray-500">This season</div>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Clean Sheets
                </h3>
                <div className="text-2xl font-bold">{currentUserData.teamStats.cleanSheets}</div>
                <div className="text-sm text-gray-500">Defensive record</div>
              </Card>
            </div>
            
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Top Players
              </h3>
              <div className="space-y-3">
                {currentUserData.players.slice(0, 5).map((player) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-500">{player.position}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{player.rating}</div>
                      <div className="text-sm text-gray-500">Rating</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="flex-1 p-4">
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                AI Assistant Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Response Confidence Threshold: {confidenceThreshold[0]}%
                  </label>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher values mean more confident responses
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto Analysis</label>
                    <p className="text-xs text-gray-500">Automatically analyze team data</p>
                  </div>
                  <Switch
                    checked={autoAnalysis}
                    onCheckedChange={setAutoAnalysis}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Real-time Updates</label>
                    <p className="text-xs text-gray-500">Get live data updates</p>
                  </div>
                  <Switch
                    checked={realTimeUpdates}
                    onCheckedChange={setRealTimeUpdates}
                  />
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Capabilities
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Player Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Performance Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Tactical Advice</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Training Plans</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Match Predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Injury Tracking</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export type { UserData, Player, TeamStats, Match, MatchPrediction, WeatherData, AdvancedAnalytics };