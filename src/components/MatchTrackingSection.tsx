import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Play,
  Pause,
  Square,
  Clock,
  Target,
  Users,
  AlertTriangle,
  Plus,
  Minus,
  RotateCcw,
  Flag,
  Activity,
  Timer,
  Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface MatchEvent {
  id: string;
  type: 'goal' | 'card' | 'substitution' | 'foul' | 'corner' | 'offside';
  player: string;
  team: 'home' | 'away';
  minute: number;
  description: string;
}

interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  cards: { home: number; away: number };
}

export const MatchTrackingSection: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const [activeTab, setActiveTab] = useState('live');
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [matchTime, setMatchTime] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeTeam, setHomeTeam] = useState('CD Statsor');
  const [awayTeam, setAwayTeam] = useState('Jaén FS');
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [newEventType, setNewEventType] = useState('');
  const [newEventPlayer, setNewEventPlayer] = useState('');
  const [newEventTeam, setNewEventTeam] = useState<'home' | 'away'>('home');
  const [newEventDescription, setNewEventDescription] = useState('');

  const [matchStats, setMatchStats] = useState<MatchStats>({
    possession: { home: 52, away: 48 },
    shots: { home: 8, away: 6 },
    corners: { home: 4, away: 2 },
    fouls: { home: 7, away: 9 },
    cards: { home: 1, away: 2 }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMatchActive) {
      interval = setInterval(() => {
        setMatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMatchActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentMinute = () => {
    return Math.floor(matchTime / 60);
  };

  const handleStartMatch = () => {
    setIsMatchActive(true);
  };

  const handlePauseMatch = () => {
    setIsMatchActive(false);
  };

  const handleStopMatch = () => {
    setIsMatchActive(false);
    setMatchTime(0);
  };

  const handleAddGoal = (team: 'home' | 'away') => {
    if (team === 'home') {
      setHomeScore(prev => prev + 1);
    } else {
      setAwayScore(prev => prev + 1);
    }
    
    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      type: 'goal',
      player: team === 'home' ? 'Player Name' : 'Opponent Player',
      team,
      minute: getCurrentMinute(),
      description: `Goal scored by ${team === 'home' ? homeTeam : awayTeam}`
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleAddEvent = () => {
    if (newEventType && newEventPlayer) {
      const newEvent: MatchEvent = {
        id: Date.now().toString(),
        type: newEventType as any,
        player: newEventPlayer,
        team: newEventTeam,
        minute: getCurrentMinute(),
        description: newEventDescription || `${newEventType} - ${newEventPlayer}`
      };
      setEvents(prev => [newEvent, ...prev]);
      setNewEventType('');
      setNewEventPlayer('');
      setNewEventDescription('');
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="h-4 w-4 text-green-600" />;
      case 'card': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'substitution': return <Users className="h-4 w-4 text-blue-600" />;
      case 'foul': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'corner': return <Flag className="h-4 w-4 text-purple-600" />;
      case 'offside': return <Flag className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'goal': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-yellow-100 text-yellow-800';
      case 'substitution': return 'bg-blue-100 text-blue-800';
      case 'foul': return 'bg-red-100 text-red-800';
      case 'corner': return 'bg-purple-100 text-purple-800';
      case 'offside': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="mt-8"
    >
      <Card className={`${
        isHighContrast ? 'hc-card' :
        theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
      }`}>
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Match Tracking</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Live match monitoring and event tracking
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                isMatchActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isMatchActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span className="text-xs font-medium">
                  {isMatchActive ? 'LIVE' : 'STOPPED'}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 m-4 mb-0">
              <TabsTrigger 
                value="live" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Live Match
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-700"
              >
                <Activity className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-700"
              >
                <Target className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="p-4 pt-0">
              <div className="space-y-6">
                {/* Match Timer and Score */}
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {formatTime(matchTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getCurrentMinute()}' - Match Time
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{homeScore}</div>
                        <div className="font-medium text-gray-900">{homeTeam}</div>
                        <div className="text-sm text-gray-600">Home</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-400">VS</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">{awayScore}</div>
                        <div className="font-medium text-gray-900">{awayTeam}</div>
                        <div className="text-sm text-gray-600">Away</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Match Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Match Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center space-x-4">
                      <Button 
                        onClick={handleStartMatch}
                        disabled={isMatchActive}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                      <Button 
                        onClick={handlePauseMatch}
                        disabled={!isMatchActive}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button 
                        onClick={handleStopMatch}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          {homeTeam} Goals
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-xl font-bold text-blue-600 w-8 text-center">
                            {homeScore}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddGoal('home')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          {awayTeam} Goals
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-xl font-bold text-green-600 w-8 text-center">
                            {awayScore}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddGoal('away')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events" className="p-4 pt-0">
              <div className="space-y-4">
                {/* Add Event Form */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Add Match Event</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eventType">Event Type</Label>
                        <Select value={newEventType} onValueChange={setNewEventType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="goal">Goal</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="substitution">Substitution</SelectItem>
                            <SelectItem value="foul">Foul</SelectItem>
                            <SelectItem value="corner">Corner</SelectItem>
                            <SelectItem value="offside">Offside</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="eventTeam">Team</Label>
                        <Select value={newEventTeam} onValueChange={(value: 'home' | 'away') => setNewEventTeam(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">{homeTeam}</SelectItem>
                            <SelectItem value="away">{awayTeam}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="eventPlayer">Player</Label>
                        <Input
                          id="eventPlayer"
                          value={newEventPlayer}
                          onChange={(e) => setNewEventPlayer(e.target.value)}
                          placeholder="Player name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="eventDescription">Description</Label>
                        <Input
                          id="eventDescription"
                          value={newEventDescription}
                          onChange={(e) => setNewEventDescription(e.target.value)}
                          placeholder="Event description"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddEvent} className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </CardContent>
                </Card>

                {/* Events Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Match Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {events.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No events recorded yet</p>
                        </div>
                      ) : (
                        events.map((event) => (
                          <div key={event.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {getEventIcon(event.type)}
                              <Badge className={getEventColor(event.type)}>
                                {event.type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{event.player}</span>
                                <span className="text-sm text-gray-600">({event.team === 'home' ? homeTeam : awayTeam})</span>
                              </div>
                              <p className="text-sm text-gray-600">{event.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{event.minute}'</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="p-4 pt-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {matchStats.possession.home}%
                      </div>
                      <div className="text-sm text-gray-600">Possession</div>
                      <div className="text-xs text-gray-500 mt-1">{homeTeam}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {matchStats.shots.home}
                      </div>
                      <div className="text-sm text-gray-600">Shots</div>
                      <div className="text-xs text-gray-500 mt-1">{homeTeam}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {matchStats.corners.home}
                      </div>
                      <div className="text-sm text-gray-600">Corners</div>
                      <div className="text-xs text-gray-500 mt-1">{homeTeam}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {matchStats.fouls.home}
                      </div>
                      <div className="text-sm text-gray-600">Fouls</div>
                      <div className="text-xs text-gray-500 mt-1">{homeTeam}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {matchStats.cards.home}
                      </div>
                      <div className="text-sm text-gray-600">Cards</div>
                      <div className="text-xs text-gray-500 mt-1">{homeTeam}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Match Statistics Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Possession</span>
                          <span className="text-sm text-gray-600">
                            {matchStats.possession.home}% - {matchStats.possession.away}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-500 h-3 rounded-l-full" 
                            style={{ width: `${matchStats.possession.home}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Shots</span>
                          <span className="text-sm text-gray-600">
                            {matchStats.shots.home} - {matchStats.shots.away}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-500 h-3 rounded-l-full" 
                              style={{ width: `${(matchStats.shots.home / (matchStats.shots.home + matchStats.shots.away)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Corners</span>
                          <span className="text-sm text-gray-600">
                            {matchStats.corners.home} - {matchStats.corners.away}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-purple-500 h-3 rounded-l-full" 
                              style={{ width: `${(matchStats.corners.home / Math.max(matchStats.corners.home + matchStats.corners.away, 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Fouls</span>
                          <span className="text-sm text-gray-600">
                            {matchStats.fouls.home} - {matchStats.fouls.away}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-yellow-500 h-3 rounded-l-full" 
                              style={{ width: `${(matchStats.fouls.home / (matchStats.fouls.home + matchStats.fouls.away)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};