import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { dataManagementService, Player } from '../services/dataManagementService';
import { toast } from 'sonner';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Plus,
  Minus,
  Goal,
  UserX,
  MapPin,
  BarChart3,
  Activity,
  Award,
  Settings,
  Shield,
  Bot,
  BookOpen
} from 'lucide-react';

// Interface for transformed player data for dashboard
interface DashboardPlayer {
  name: string;
  position: string;
  minutes: number;
  goals: number;
  assists: number;
  fitness: number;
  shots: number;
  cards: number;
  fitCom: number;
}

// Interface for attendance records
interface AttendanceRecord {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

// Match Timer Component
const MatchTimer: React.FC = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { theme, isHighContrast } = useTheme();
  const { language } = useLanguage();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      intervalId = setInterval(() => setTime(time => time + 1), 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setTime(0);
    setIsRunning(false);
    setIsPaused(false);
  };

  return (
    <Card className={`glass-card animate-fade-in hover-lift ${
      theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
    }`}>
      <CardHeader>
        <CardTitle className="text-center gradient-text-primary animate-soft-pulse">
          {language === 'en' ? 'Match Timer' : 'Match Timer'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-4xl font-bold mb-4 font-mono text-glow animate-breathe">
            {formatTime(time)}
          </div>
          <div className="flex justify-center space-x-2">
            <Button
              onClick={startTimer}
              disabled={isRunning && !isPaused}
              size="sm"
              className="glass-button hover-glow focus-glow"
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              onClick={pauseTimer}
              disabled={!isRunning}
              size="sm"
              className="glass-button hover-glow focus-glow"
              variant="outline"
            >
              <Pause className="w-4 h-4" />
            </Button>
            <Button
              onClick={resetTimer}
              size="sm"
              className="glass-button hover-glow focus-glow"
              variant="outline"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Team Score Component
const TeamScore: React.FC<{ teamName: string; color: string }> = ({ teamName, color }) => {
  const [score, setScore] = useState(0);
  const { theme, isHighContrast } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const tiltX = isHovered ? (mousePosition.y - 120) / 10 : 0;
  const tiltY = isHovered ? (mousePosition.x - 120) / -10 : 0;

  return (
    <motion.div
      ref={cardRef}
      animate={{
        rotateX: tiltX,
        rotateY: tiltY,
        z: isHovered ? 20 : 0,
        scale: isHovered ? 1.02 : 1
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer relative"
    >
      {/* 3D Cursor Follower */}
      <motion.div
        className="absolute pointer-events-none z-10"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <div className="w-4 h-4 rounded-full bg-primary/40 blur-sm" />
      </motion.div>

      {/* Interactive Light Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: isHovered 
            ? `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`
            : 'none'
        }}
      />

      <Card className="glass-card relative overflow-hidden animate-slide-in-up hover-lift">
        <CardContent className="p-6">
          <div className="text-center">
            <motion.div 
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isHighContrast ? 'bg-black border-2 border-black' : color
              }`}
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotateY: isHovered ? 15 : 0,
                z: isHovered ? 15 : 0
              }}
              transition={{ duration: 0.3 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h3 
              className="font-bold text-lg mb-2 gradient-text-subtle"
              animate={{
                x: isHovered ? 2 : 0,
                z: isHovered ? 10 : 0
              }}
              transition={{ duration: 0.3 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {teamName}
            </motion.h3>
            <motion.div 
              className="text-3xl font-bold mb-4 text-glow animate-breathe"
              animate={{
                scale: isHovered ? 1.05 : 1,
                z: isHovered ? 15 : 0
              }}
              transition={{ duration: 0.3 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {score}
            </motion.div>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={() => setScore(score + 1)}
                size="sm"
                className="glass-button hover-glow focus-glow animate-gentle-float"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setScore(Math.max(0, score - 1))}
                size="sm"
                className="glass-button hover-glow focus-glow animate-gentle-float"
                variant="outline"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Action Buttons Component
const ActionButtons: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const { language } = useLanguage();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {
    setHoveredAction(null);
    setMousePosition({ x: 0, y: 0 });
  };

  const actions = [
    { id: 'goal_favor', label: language === 'en' ? 'Goal For' : 'Goal For', color: isHighContrast ? 'hc-button-primary' : 'bg-green-500', icon: Goal },
    { id: 'goal_against', label: language === 'en' ? 'Goal Against' : 'Goal Against', color: isHighContrast ? 'hc-button-primary' : 'bg-red-500', icon: Goal },
    { id: 'assist', label: language === 'en' ? 'Assist' : 'Assist', color: isHighContrast ? 'hc-button-primary' : 'bg-blue-500', icon: Target },
    { id: 'foul_favor', label: language === 'en' ? 'Foul For' : 'Foul For', color: isHighContrast ? 'hc-button-secondary' : 'bg-yellow-500', icon: UserX },
    { id: 'foul_against', label: language === 'en' ? 'Foul Against' : 'Foul Against', color: isHighContrast ? 'hc-button-secondary' : 'bg-orange-500', icon: UserX },
    { id: 'shot_goal', label: language === 'en' ? 'Shot on Goal' : 'Shot on Goal', color: isHighContrast ? 'hc-button-primary' : 'bg-purple-500', icon: Activity },
    { id: 'shot_out', label: language === 'en' ? 'Shot Out' : 'Shot Out', color: isHighContrast ? 'hc-button-secondary' : 'bg-gray-500', icon: Activity },
    { id: 'corner_favor', label: language === 'en' ? 'Corner For' : 'Corner For', color: isHighContrast ? 'hc-button-primary' : 'bg-teal-500', icon: MapPin },
    { id: 'corner_against', label: language === 'en' ? 'Corner Against' : 'Corner Against', color: isHighContrast ? 'hc-button-secondary' : 'bg-pink-500', icon: MapPin },
    { id: 'offside', label: language === 'en' ? 'Offside' : 'Offside', color: isHighContrast ? 'hc-button-secondary' : 'bg-indigo-500', icon: UserX },
    { id: 'penalty_favor', label: language === 'en' ? 'Penalty For' : 'Penalty For', color: isHighContrast ? 'hc-button-primary' : 'bg-green-600', icon: Award },
    { id: 'penalty_against', label: language === 'en' ? 'Penalty Against' : 'Penalty Against', color: isHighContrast ? 'hc-button-primary' : 'bg-red-600', icon: Award }
  ];

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId);
    
    // Show toast notification for the action
    const actionLabel = actions.find(a => a.id === actionId)?.label || actionId;
    toast.success(`${actionLabel} registered!`, {
      duration: 2000,
      position: 'top-right'
    });
    
    // Store action in localStorage for persistence
    const existingActions = JSON.parse(localStorage.getItem('match_actions') || '[]');
    const newAction = {
      id: Date.now(),
      type: actionId,
      label: actionLabel,
      timestamp: new Date().toISOString(),
      minute: Math.floor(Math.random() * 90) + 1 // Mock minute for demo
    };
    existingActions.push(newAction);
    localStorage.setItem('match_actions', JSON.stringify(existingActions));
    
    // Add haptic feedback simulation
    setTimeout(() => setSelectedAction(null), 200);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {/* 3D Cursor Follower */}
      <motion.div
        className="absolute pointer-events-none z-20"
        animate={{
          x: mousePosition.x - 6,
          y: mousePosition.y - 6,
          opacity: hoveredAction ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <div className="w-3 h-3 rounded-full bg-primary/50 blur-sm" />
      </motion.div>

      {/* Interactive Light Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: hoveredAction 
            ? `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.08), transparent 40%)`
            : 'none'
        }}
      />

      <Card className={`relative overflow-hidden ${
        isHighContrast ? 'hc-card' :
        theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{language === 'en' ? 'Actions' : 'Actions'}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/manual-actions')}
              className="text-sm"
            >
              {language === 'en' ? 'View All' : 'Ver Todo'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {actions.map((action) => {
              const isHovered = hoveredAction === action.id;
              return (
                <motion.div
                  key={action.id}
                  whileHover={{ 
                    scale: 1.05,
                    rotateX: 5,
                    rotateY: 5,
                    z: 10
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: selectedAction === action.id ? 0.95 : 1,
                  }}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: 1000
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  <Button
                    onClick={() => handleActionClick(action.id)}
                    variant={isHighContrast ? undefined : "outline"}
                    className={`w-full h-16 flex flex-col items-center justify-center text-xs p-2 ${
                      isHighContrast ? action.color : `${action.color} text-white border-none hover:opacity-80`
                    } transition-all duration-200 relative overflow-hidden`}
                  >
                    <motion.div
                      animate={{
                        scale: isHovered ? 1.1 : 1,
                        z: isHovered ? 5 : 0
                      }}
                      transition={{ duration: 0.2 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <action.icon className="w-4 h-4 mb-1" />
                    </motion.div>
                    <motion.span 
                      className="text-center leading-tight text-contained"
                      animate={{
                        y: isHovered ? -1 : 0,
                        z: isHovered ? 3 : 0
                      }}
                      transition={{ duration: 0.2 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {action.label}
                    </motion.span>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Player Field Component
const PlayerField: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const { language } = useLanguage();
  
  const players = [
    { name: 'Pablo', position: 'GK', jersey: '1' },
    { name: 'Lean', position: 'DEF', jersey: '2' },
    { name: 'Adrián', position: 'DEF', jersey: '3' },
    { name: 'Julio', position: 'MID', jersey: '4' },
    { name: 'Luis', position: 'MID', jersey: '5' },
    { name: 'Nil', position: 'FWD', jersey: '6' },
    { name: 'Roberto', position: 'FWD', jersey: '7' },
    { name: 'Pol', position: 'SUB', jersey: '8' }
  ];

  return (
    <Card className={`${
      isHighContrast ? 'hc-card' :
      theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{language === 'en' ? 'Players' : 'Players'}</span>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-1" />
            {language === 'en' ? 'Add' : 'Add'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {players.map((player, index) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border flex items-center space-x-3 ${
                isHighContrast ? 'border-black bg-white' :
                theme === 'midnight' ? 'border-gray-200 bg-white' : 'border-gray-200 bg-white'
              } ${player.position === 'SUB' ? 'opacity-50' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isHighContrast ? 'bg-black text-white border-2 border-black' :
                player.position === 'GK' ? 'bg-yellow-500 text-white' :
                player.position === 'DEF' ? 'bg-blue-500 text-white' :
                player.position === 'MID' ? 'bg-green-500 text-white' :
                player.position === 'FWD' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                {player.jersey}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm text-contained ${
                  isHighContrast ? 'text-black' : 'text-gray-900'
                }`}>{player.name}</div>
                <div className={`text-xs text-contained ${
                  isHighContrast ? 'text-black opacity-70' : 'text-gray-600'
                }`}>{player.position}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const InteractiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, isHighContrast } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [evolutionData, setEvolutionData] = useState([
    { partido: 1, victories: 0, points: 0, goalsFor: 0, goalsAgainst: 0 },
    { partido: 2, victories: 50, points: 1, goalsFor: 2, goalsAgainst: 3 },
    { partido: 3, victories: 100, points: 3, goalsFor: 3, goalsAgainst: 0 },
    { partido: 4, victories: 25, points: 1, goalsFor: 1, goalsAgainst: 3 },
    { partido: 5, victories: 100, points: 3, goalsFor: 4, goalsAgainst: 1 },
    { partido: 6, victories: 100, points: 3, goalsFor: 3, goalsAgainst: 0 }
  ]);

  // Mock data for recent matches
  const [recentMatches] = useState([
    { id: '1', date: '2025-07-20', homeTeam: 'CD Statsor', awayTeam: 'Real Madrid', homeScore: 3, awayScore: 2, result: 'W' },
    { id: '2', date: '2025-07-15', homeTeam: 'CD Statsor', awayTeam: 'Barcelona', homeScore: 1, awayScore: 1, result: 'D' },
    { id: '3', date: '2025-07-10', homeTeam: 'CD Statsor', awayTeam: 'Atletico Madrid', homeScore: 2, awayScore: 0, result: 'W' },
    { id: '4', date: '2025-07-05', homeTeam: 'CD Statsor', awayTeam: 'Valencia', homeScore: 0, awayScore: 2, result: 'L' },
    { id: '5', date: '2025-06-30', homeTeam: 'CD Statsor', awayTeam: 'Sevilla', homeScore: 3, awayScore: 1, result: 'W' }
  ]);

  // Mock data for analytics
  const [analyticsData] = useState({
    performance: {
      goals: 15,
      assists: 12,
      shotsOnTarget: 42,
      passAccuracy: 87,
      duelsWon: 128,
      possession: 58
    },
    attack: {
      shotsOnTarget: 42,
      shotsOffTarget: 28,
      goals: 15,
      assists: 12,
      keyPasses: 35,
      dribblesSuccessful: 22
    },
    defense: {
      ballsRecovered: 89,
      interceptions: 67,
      tacklesWon: 78,
      goalsConceded: 11,
      defensiveDuelsWon: 92
    },
    discipline: {
      foulsCommitted: 45,
      foulsReceived: 38,
      yellowCards: 8,
      redCards: 1
    }
  });

  const [playersData, setPlayersData] = useState<DashboardPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0] || '');

  // Fetch real player data
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoadingPlayers(true);
        const players = await dataManagementService.getPlayers();
        // Transform the data to match the dashboard format
        const transformedPlayers: DashboardPlayer[] = players.map(player => ({
          name: player.name,
          position: player.position,
          minutes: player.minutes || 0,
          goals: player.goals || 0,
          assists: player.assists || 0,
          fitness: (player as any)['fitness'] || 0,
          shots: player.shots || 0,
          cards: (player.yellow_cards || 0) + (player.red_cards || 0),
          fitCom: player.fouls_committed || 0
        }));
        setPlayersData(transformedPlayers);
      } catch (error) {
        console.error('Error fetching players:', error);
        // Fallback to mock data if fetch fails
        const mockPlayers = [
          { name: 'Fernando Torres', position: 'DEL', minutes: 480, goals: 5, assists: 3, fitness: 8, shots: 12, cards: 2, fitCom: 2 },
          { name: 'Pablo Sánchez', position: 'CEN', minutes: 465, goals: 2, assists: 6, fitness: 6, shots: 8, cards: 2, fitCom: 4 },
          { name: 'Juan Pérez', position: 'DEL', minutes: 420, goals: 3, assists: 2, fitness: 6, shots: 10, cards: 1, fitCom: 3 },
          { name: 'Miguel Rodríguez', position: 'CEN', minutes: 390, goals: 1, assists: 4, fitness: 3, shots: 6, cards: 3, fitCom: 5 },
          { name: 'David González', position: 'DEF', minutes: 480, goals: 1, assists: 0, fitness: 2, shots: 3, cards: 1, fitCom: 8 }
        ];
        setPlayersData(mockPlayers);
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchPlayers();
  }, []);

  // Load attendance records from localStorage
  useEffect(() => {
    const savedRecords = localStorage.getItem('statsor_attendance');
    if (savedRecords) {
      try {
        setAttendanceRecords(JSON.parse(savedRecords));
      } catch (error) {
        console.error('Error parsing attendance records:', error);
        setAttendanceRecords([]);
      }
    }
  }, []);

  // Calculate cumulative points for the line chart
  const cumulativePoints = evolutionData.map((item, index) => {
    const cumulative = evolutionData.slice(0, index + 1).reduce((sum, curr) => sum + curr.points, 0);
    return { ...item, cumulative };
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isHighContrast ? 'hc-dashboard' :
      theme === 'midnight' 
        ? 'bg-white text-gray-900' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
            isHighContrast ? 'text-black' : 'text-gray-900'
          }`}>
            Home
          </h1>
        </motion.div>

        {/* Stats Cards - Full width cards with different colors */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 h-full flex flex-col shadow-lg">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between flex-grow">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Points</p>
                    <p className="text-3xl font-bold mt-1">24</p>
                    <p className="text-blue-100 text-xs mt-1">Current Season</p>
                  </div>
                  <Trophy className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 h-full flex flex-col shadow-lg">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between flex-grow">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Last Result</p>
                    <p className="text-lg font-bold mt-1">CD Statsor 5-3 Jaén</p>
                    <p className="text-green-100 text-xs mt-1">3 days ago</p>
                  </div>
                  <Target className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 h-full flex flex-col shadow-lg">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between flex-grow">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">% Victories</p>
                    <p className="text-3xl font-bold mt-1">66.7%</p>
                    <p className="text-purple-100 text-xs mt-1">6 of 12 matches</p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 h-full flex flex-col shadow-lg">
              <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between flex-grow">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Season - Jaén</p>
                    <p className="text-lg font-bold mt-1">Age</p>
                    <p className="text-orange-100 text-xs mt-1">Division</p>
                  </div>
                  <Users className="h-12 w-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analytics Overview Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                  <span>Statistics Overview</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/general-stats')}
                  className="text-sm"
                >
                  View Detailed Analytics
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Performance Block */}
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Performance</p>
                        <p className="text-xl font-bold mt-1">{analyticsData.performance.goals + analyticsData.performance.assists}</p>
                        <p className="text-purple-100 text-xs mt-1">Goals & Assists</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                {/* Attack Block */}
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Attack</p>
                        <p className="text-xl font-bold mt-1">{analyticsData.attack.goals}</p>
                        <p className="text-green-100 text-xs mt-1">Goals Scored</p>
                      </div>
                      <Target className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                {/* Defense Block */}
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Defense</p>
                        <p className="text-xl font-bold mt-1">{analyticsData.defense.tacklesWon}</p>
                        <p className="text-blue-100 text-xs mt-1">Tackles Won</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                {/* Discipline Block */}
                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Discipline</p>
                        <p className="text-xl font-bold mt-1">{analyticsData.discipline.yellowCards + analyticsData.discipline.redCards}</p>
                        <p className="text-orange-100 text-xs mt-1">Cards</p>
                      </div>
                      <Award className="h-8 w-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Evolution Chart and Players Table - Better organized with proper spacing */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Evolution Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className={`h-full ${
              isHighContrast ? 'hc-card' :
              theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-purple-600" />
                  Team Evolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 relative">
                  {/* Simplified chart with no overlapping */}
                  <div className="flex items-end h-64 mt-4 mb-4 border-b border-l border-gray-300 p-4">
                    {/* Y-axis labels */}
                    <div className="flex flex-col justify-between h-full mr-3 text-xs text-gray-500">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                    
                    {/* Chart bars - simplified and spaced */}
                    <div className="flex items-end flex-1 space-x-6">
                      {cumulativePoints.map((point, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          {/* Victory rate bar - simplified */}
                          <div 
                            className="w-full bg-green-500 rounded-t transition-all duration-500"
                            style={{ height: `${point.victories * 0.6}px` }}
                          ></div>
                          
                          {/* Points indicator - simplified */}
                          <div className="mt-2 text-xs font-semibold text-purple-600">
                            {point.points} pts
                          </div>
                          
                          {/* X-axis label */}
                          <div className="mt-1 text-xs text-gray-600">
                            M{point.partido}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Legend - simplified */}
                  <div className="flex justify-center space-x-6 mt-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                      <span className="text-xs text-gray-600">Victory Rate</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                      <span className="text-xs text-gray-600">Points</span>
                    </div>
                  </div>
                  
                  {/* Summary statistics - simplified */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {cumulativePoints[cumulativePoints.length - 1]?.cumulative || 0}
                      </div>
                      <div className="text-xs text-gray-600">Total Points</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">
                        {Math.round(cumulativePoints.reduce((sum, point) => sum + point.victories, 0) / cumulativePoints.length)}%
                      </div>
                      <div className="text-xs text-gray-600">Avg Victory Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Matches Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <Card className={`${
              isHighContrast ? 'hc-card' :
              theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Matches</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/matches')}
                    className="text-sm"
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMatches.map((match) => (
                    <div 
                      key={match.id} 
                      className={`p-4 rounded-lg border flex items-center justify-between ${
                        isHighContrast ? 'border-black bg-white' :
                        theme === 'midnight' ? 'border-gray-200 bg-white' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600 w-20">
                          {formatDate(match.date)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{match.homeTeam}</span>
                          <span className="text-gray-600">vs</span>
                          <span className="font-medium">{match.awayTeam}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <span className="font-bold">{match.homeScore}</span>
                          <span className="text-gray-600">-</span>
                          <span className="font-bold">{match.awayScore}</span>
                        </div>
                        <Badge 
                          className={`${
                            match.result === 'W' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : match.result === 'D' 
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {match.result === 'W' ? 'Win' : match.result === 'D' ? 'Draw' : 'Loss'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Matches Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Matches</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/matches')}
                  className="text-sm"
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base">{formatDate(match.date)}</p>
                      <p className="text-sm text-gray-600 text-contained">
                        {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
                      </p>
                      <Badge 
                        className={
                          match.result === 'W' ? 'bg-green-100 text-green-800' : 
                          match.result === 'D' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }
                      >
                        {match.result === 'W' ? 'Win' : match.result === 'D' ? 'Draw' : 'Loss'}
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/matches`)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                    >
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Matches - Horizontal Line Format */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-6">
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'midnight' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className="text-gray-900">{t('matches.upcoming')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex overflow-x-auto space-x-4 pb-4">
                <div className="flex space-x-4 min-w-max">
                  <div className="flex-shrink-0 w-64 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">July 25, 2025</p>
                      <p className="text-sm text-gray-600 mt-1">CD Statsor vs Jaén FS</p>
                      <p className="text-xs text-gray-500 mt-1">Pabellón Municipal</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/matches')}
                        className="mt-3 border-gray-300 text-gray-700 hover:bg-gray-100 text-sm w-full"
                      >
                        {t('manual.actions.details')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 w-64 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">August 1, 2025</p>
                      <p className="text-sm text-gray-600 mt-1">CD Statsor vs Granada CF</p>
                      <p className="text-xs text-gray-500 mt-1">Estadio Nuevo Los Cármenes</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/matches')}
                        className="mt-3 border-gray-300 text-gray-700 hover:bg-gray-100 text-sm w-full"
                      >
                        {t('manual.actions.details')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 w-64 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">August 8, 2025</p>
                      <p className="text-sm text-gray-600 mt-1">CD Statsor vs Real Madrid</p>
                      <p className="text-xs text-gray-500 mt-1">Santiago Bernabéu</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/matches')}
                        className="mt-3 border-gray-300 text-gray-700 hover:bg-gray-100 text-sm w-full"
                      >
                        {t('manual.actions.details')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>


      </div>
    </div>
  );
};
