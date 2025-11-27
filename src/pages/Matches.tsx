import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, MapPin, Clock, Users, Target, TrendingUp, Plus, X, ArrowLeft, Trophy, Award, Copy, Download, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import MatchNotesModal from '../components/MatchNotesModal';
import { dataManagementService } from '../services/dataManagementService';
import { demoAccountService, DemoMatch } from '../services/demoAccountService';

interface Match {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  status: 'completed' | 'upcoming';
}

interface MatchStats {
  firstHalf: {
    goalLocations: { location: string; player: string; minute: number }[];
    goals: number;
    assists: number;
    shots: number;
    shotsOff: number;
    foulsCommitted: number;
    foulsReceived: number;
    ballsLost: number;
    ballsRecovered: number;
    duelsWon: number;
    duelsLost: number;
    saves: number;
    possession: number;
  };
  secondHalf: {
    goalLocations: { location: string; player: string; minute: number }[];
    goals: number;
    assists: number;
    shots: number;
    shotsOff: number;
    foulsCommitted: number;
    foulsReceived: number;
    ballsLost: number;
    ballsRecovered: number;
    duelsWon: number;
    duelsLost: number;
    saves: number;
    possession: number;
  };
}

interface MatchPlayer {
  id: string;
  name: string;
  number: number;
  goals: number;
  assists: number;
  mvpRating?: number;
  photo?: string;
}

const Matches = () => {
  const { t } = useLanguage();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [matchNotes, setMatchNotes] = useState<any[]>([]);
  const [showAddMatchForm, setShowAddMatchForm] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch matches from database or demo service
  const fetchMatches = async () => {
    try {
      setLoading(true);
      console.log('[Matches] Fetching matches...');
      
      // Check if this is a demo account
      const isDemo = localStorage.getItem('user_type') === 'demo';
      
      if (isDemo) {
        console.log('[Matches] Loading demo matches');
        // For demo accounts, load matches from demo service
        const demoMatches = demoAccountService.getDemoMatches();
        // Transform demo matches to match our interface
        const transformedMatches: Match[] = demoMatches.map((match: DemoMatch) => ({
          id: match.id,
          date: match.date,
          homeTeam: match.venue === 'home' ? 'Statsor FC' : match.opponent,
          awayTeam: match.venue === 'home' ? match.opponent : 'Statsor FC',
          homeScore: match.score && typeof match.score === 'string' && match.score.includes('-') ? parseInt((match.score.split('-')[0]) ?? '0', 10) : 0,
          awayScore: match.score && typeof match.score === 'string' && match.score.includes('-') ? parseInt((match.score.split('-')[1]) ?? '0', 10) : 0,
          venue: match.venue === 'home' ? 'Victory Stadium' : match.opponent,
          status: match.result === 'win' || match.result === 'loss' || match.result === 'draw' ? 'completed' : 'upcoming'
        }));
        console.log('[Matches] Loaded demo matches:', transformedMatches.length);
        setMatches(transformedMatches);
      } else {
        console.log('[Matches] Loading real matches using dataManagementService');
        // Use dataManagementService for consistent data access
        const matchesData = await dataManagementService.getMatches();
        
        console.log('[Matches] Fetched matches:', matchesData?.length || 0);
        
        // Transform database data to match component expectations
        const transformedMatches = (matchesData || []).map((match: any) => ({
          id: match.id?.toString() || '',
          date: match.match_date || match.date || '',
          homeTeam: match.home_team || (match.is_home ? 'Your Team' : match.opponent_name) || 'TBD',
          awayTeam: match.away_team || (match.is_home ? match.opponent_name : 'Your Team') || 'TBD',
          homeScore: match.home_score || 0,
          awayScore: match.away_score || 0,
          venue: match.venue || match.location || 'TBD',
          status: (match.status || 'upcoming') as 'completed' | 'upcoming'
        }));

        setMatches(transformedMatches);
      }
    } catch (error) {
      console.error('[Matches] Error fetching matches:', error);
      toast.error('Error loading matches. Please try again.');
      // Show empty state instead of error for better UX
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches on component mount
  useEffect(() => {
    fetchMatches();
  }, []);
  
  const [newMatch, setNewMatch] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    venue: '',
    status: 'upcoming' as 'completed' | 'upcoming',
    homeScore: 0,
    awayScore: 0
  });
  
  const handleAddMatch = async () => {
    if (!newMatch.homeTeam || !newMatch.awayTeam || !newMatch.date || !newMatch.venue) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Check if this is a demo account
      const isDemo = localStorage.getItem('user_type') === 'demo';
      
      if (isDemo) {
        // For demo accounts, save to localStorage
        const newMatchObj: Match = {
          id: Date.now().toString(),
          homeTeam: newMatch.homeTeam,
          awayTeam: newMatch.awayTeam,
          date: newMatch.date,
          venue: newMatch.venue,
          status: newMatch.status,
          homeScore: newMatch.homeScore,
          awayScore: newMatch.awayScore
        };
        
        const updatedMatches = [newMatchObj, ...matches];
        setMatches(updatedMatches);
        localStorage.setItem('statsor_demo_matches', JSON.stringify(updatedMatches));
        
        // Reset form
        setNewMatch({
          homeTeam: '',
          awayTeam: '',
          date: '',
          venue: '',
          status: 'upcoming',
          homeScore: 0,
          awayScore: 0
        });
        setShowAddMatchForm(false);
        toast.success('Match added successfully!');
      } else {
        // For real accounts, save to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('Please sign in to add matches');
          return;
        }

        // Get user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError);
          toast.error('Profile not found. Please complete your profile setup.');
          return;
        }

        // Get user's team
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id')
          .eq('manager_id', profile.id)
          .limit(1);

        if (teamsError || !teams || teams.length === 0) {
          console.error('Error fetching team:', teamsError);
          toast.error('No team found. Please create a team first.');
          return;
        }

        const teamId = teams[0]?.id;
        
        if (!teamId) {
          toast.error('Invalid team data. Please try again.');
          return;
        }

        const { data, error } = await supabase
          .from('matches')
          .insert({
            home_team_id: teamId,
            away_team_id: null,
            competition: 'Friendly',
            match_date: newMatch.date,
            venue: newMatch.venue,
            status: newMatch.status,
            home_score: newMatch.homeScore,
            away_score: newMatch.awayScore,
            notes: `${newMatch.homeTeam} vs ${newMatch.awayTeam}`
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding match:', error);
          toast.error(`Error adding match: ${error.message}`);
          return;
        }

        // Transform and add to local state
        const transformedMatch: Match = {
          id: data.id.toString(),
          date: data.match_date,
          homeTeam: newMatch.homeTeam,
          awayTeam: newMatch.awayTeam,
          homeScore: data.home_score || 0,
          awayScore: data.away_score || 0,
          venue: data.venue,
          status: data.status as 'completed' | 'upcoming'
        };

        setMatches(prev => [transformedMatch, ...prev]);
        setNewMatch({
          homeTeam: '',
          awayTeam: '',
          date: '',
          venue: '',
          status: 'upcoming',
          homeScore: 0,
          awayScore: 0
        });
        setShowAddMatchForm(false);
        toast.success('Match added successfully!');
      }
    } catch (error) {
      console.error('Error adding match:', error);
      toast.error('Error adding match');
    }
  };

  const handleCancelAddMatch = () => {
    setNewMatch({
      homeTeam: '',
      awayTeam: '',
      date: '',
      venue: '',
      status: 'upcoming',
      homeScore: 0,
      awayScore: 0
    });
    setShowAddMatchForm(false);
  };

  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch match statistics from database
  const fetchMatchStats = async (matchId: string) => {
    try {
      setLoadingStats(true);
      const { data, error } = await supabase
        .from('matches')
        .select('statistics, events')
        .eq('id', matchId)
        .single();

      if (error) {
        console.error('Error fetching match stats:', error);
        // Use fallback mock data if no real stats available
        setMatchStats({
          firstHalf: {
            goalLocations: [],
            goals: 0,
            assists: 0,
            shots: 0,
            shotsOff: 0,
            foulsCommitted: 0,
            foulsReceived: 0,
            ballsLost: 0,
            ballsRecovered: 0,
            duelsWon: 0,
            duelsLost: 0,
            saves: 0,
            possession: 50
          },
          secondHalf: {
            goalLocations: [],
            goals: 0,
            assists: 0,
            shots: 0,
            shotsOff: 0,
            foulsCommitted: 0,
            foulsReceived: 0,
            ballsLost: 0,
            ballsRecovered: 0,
            duelsWon: 0,
            duelsLost: 0,
            saves: 0,
            possession: 50
          }
        });
        return;
      }

      // Parse statistics and events from database
      const stats = data.statistics || {};
      const events = data.events || [];

      // Extract goal events for locations
      const goalEvents = events.filter((event: any) => event.type === 'goal');
      const firstHalfGoals = goalEvents.filter((event: any) => event.minute <= 45);
      const secondHalfGoals = goalEvents.filter((event: any) => event.minute > 45);

      setMatchStats({
        firstHalf: {
          goalLocations: firstHalfGoals.map((goal: any) => ({
            location: goal.location || 'center',
            player: goal.player || 'Unknown',
            minute: goal.minute
          })),
          goals: stats.first_half_goals || firstHalfGoals.length,
          assists: stats.first_half_assists || 0,
          shots: stats.first_half_shots || 0,
          shotsOff: stats.first_half_shots_off || 0,
          foulsCommitted: stats.first_half_fouls_committed || 0,
          foulsReceived: stats.first_half_fouls_received || 0,
          ballsLost: stats.first_half_balls_lost || 0,
          ballsRecovered: stats.first_half_balls_recovered || 0,
          duelsWon: stats.first_half_duels_won || 0,
          duelsLost: stats.first_half_duels_lost || 0,
          saves: stats.first_half_saves || 0,
          possession: stats.first_half_possession || 50
        },
        secondHalf: {
          goalLocations: secondHalfGoals.map((goal: any) => ({
            location: goal.location || 'center',
            player: goal.player || 'Unknown',
            minute: goal.minute
          })),
          goals: stats.second_half_goals || secondHalfGoals.length,
          assists: stats.second_half_assists || 0,
          shots: stats.second_half_shots || 0,
          shotsOff: stats.second_half_shots_off || 0,
          foulsCommitted: stats.second_half_fouls_committed || 0,
          foulsReceived: stats.second_half_fouls_received || 0,
          ballsLost: stats.second_half_balls_lost || 0,
          ballsRecovered: stats.second_half_balls_recovered || 0,
          duelsWon: stats.second_half_duels_won || 0,
          duelsLost: stats.second_half_duels_lost || 0,
          saves: stats.second_half_saves || 0,
          possession: stats.second_half_possession || 50
        }
      });
    } catch (error) {
      console.error('Error fetching match stats:', error);
      setMatchStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch stats when a match is selected
  useEffect(() => {
    if (selectedMatch) {
      fetchMatchStats(selectedMatch.id);
    }
  }, [selectedMatch]);

  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Fetch match players from database
  const fetchMatchPlayers = async (matchId: string) => {
    try {
      setLoadingPlayers(true);
      const { data, error } = await supabase
        .from('match_players')
        .select(`
          *,
          players (
            name,
            jersey_number
          )
        `)
        .eq('match_id', matchId);

      if (error) {
        console.error('Error fetching match players:', error);
        setMatchPlayers([]);
        return;
      }

      // Transform data to match MatchPlayer interface
      const transformedPlayers: MatchPlayer[] = data.map((player: any) => ({
        id: player.player_id,
        name: player.players?.name || 'Unknown Player',
        number: player.players?.jersey_number || 0,
        goals: player.goals || 0,
        assists: player.assists || 0,
        mvpRating: player.rating || 0
      }));

      // Sort by performance (goals * 2 + assists)
      const sortedPlayers = transformedPlayers.sort((a, b) => (b.goals * 2 + b.assists) - (a.goals * 2 + a.assists));
      setMatchPlayers(sortedPlayers);
    } catch (error) {
      console.error('Error fetching match players:', error);
      setMatchPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Fetch players when a match is selected
  useEffect(() => {
    if (selectedMatch) {
      fetchMatchPlayers(selectedMatch.id);
    }
  }, [selectedMatch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generateMatchSummary = () => {
    if (!selectedMatch) return '';

    const totalGoals = matchStats ? (matchStats.firstHalf.goals + matchStats.secondHalf.goals) : 0;
    const totalAssists = matchStats ? (matchStats.firstHalf.assists + matchStats.secondHalf.assists) : 0;
    const mvpPlayer = matchPlayers[0];
    
    const goalScorers = matchPlayers
      .filter(player => player.goals > 0)
      .map(player => `${player.name} (${player.goals} ${player.goals === 1 ? 'goal' : 'goals'})`)
      .join(', ');

    const assistProviders = matchPlayers
      .filter(player => player.assists > 0)
      .map(player => `${player.name} (${player.assists} ${player.assists === 1 ? 'assist' : 'assists'})`)
      .join(', ');

    return `The team ${selectedMatch.homeTeam} ${selectedMatch.homeScore > selectedMatch.awayScore ? 'won' : selectedMatch.homeScore < selectedMatch.awayScore ? 'lost' : 'drew'} ${selectedMatch.homeScore}-${selectedMatch.awayScore} against ${selectedMatch.awayTeam}. 

In the first half, ${matchStats ? matchStats.firstHalf.goals : 0} goals were scored and ${matchStats ? matchStats.firstHalf.assists : 0} assists were made. In the second half, ${matchStats ? matchStats.secondHalf.goals : 0} goals and ${matchStats ? matchStats.secondHalf.assists : 0} assists were recorded.

${goalScorers ? `Goal scorers: ${goalScorers}.` : ''} ${assistProviders ? `Assists: ${assistProviders}.` : ''}

${mvpPlayer ? `The standout player was ${mvpPlayer.name} with ${mvpPlayer.goals} ${mvpPlayer.goals === 1 ? 'goal' : 'goals'} and ${mvpPlayer.assists} ${mvpPlayer.assists === 1 ? 'assist' : 'assists'} (Rating: ${mvpPlayer.mvpRating ?? 0}).` : ''}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMatchSummary());
    // Here you could add a confirmation toast
  };

  const downloadPDF = () => {
    const summary = generateMatchSummary();
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match-summary-${selectedMatch?.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderMatchDetail = () => {
    if (!selectedMatch) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setSelectedMatch(null)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('players.back')}</span>
          </Button>
          
          <Button
            onClick={() => setShowSummary(!showSummary)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Award className="w-4 h-4" />
            <span>Generate Summary</span>
          </Button>
        </div>

        {/* Match Header */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
              </h2>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {selectedMatch.homeScore} - {selectedMatch.awayScore}
              </div>
              <div className="flex items-center justify-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedMatch.date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedMatch.venue}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Top Players</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlayers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : matchPlayers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {matchPlayers.slice(0, 4).map((player) => (
                  <div
                    key={player.id}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold text-gray-600">
                      {player.number}
                    </div>
                    <h4 className="font-semibold text-sm mb-2">{player.name}</h4>
                    <div className="flex justify-center space-x-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <Target className="w-3 h-3 text-green-600" />
                        <span>{player.goals}G</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="w-3 h-3 text-blue-600" />
                        <span>{player.assists}A</span>
                      </div>
                    </div>
                    {player.mvpRating && player.mvpRating > 0 && (
                      <div className="mt-2 text-xs font-semibold text-yellow-600">
                        ★ {player.mvpRating}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No player data available for this match</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Summary */}
        {showSummary && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Match Summary</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </Button>
                  <Button
                    onClick={downloadPDF}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {generateMatchSummary()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match Statistics Redesigned into 4 Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Block */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <TrendingUp className="w-5 h-5 mr-2" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : matchStats ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Possession (%)</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{matchStats.firstHalf.possession + matchStats.secondHalf.possession}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Completed Passes</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">342</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Pass Accuracy</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">85%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Distance Covered</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">102 km</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attack Block */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <Target className="w-5 h-5 mr-2" />
                Attack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  </div>
                ) : matchStats ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Goals</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{matchStats.firstHalf.goals + matchStats.secondHalf.goals}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Assists</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{matchStats.firstHalf.assists + matchStats.secondHalf.assists}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Shots on Target</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{matchStats.firstHalf.shots + matchStats.secondHalf.shots}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Shots Off Target</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{matchStats.firstHalf.shotsOff + matchStats.secondHalf.shotsOff}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Defense Block */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Shield className="w-5 h-5 mr-2" />
                Defense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : matchStats ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Tackles</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">24</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Intercepciones</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">18</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Despejes</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">32</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Balls Recovered</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">{matchStats.firstHalf.ballsRecovered + matchStats.secondHalf.ballsRecovered}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discipline Block */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <Award className="w-5 h-5 mr-2" />
                Discipline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  </div>
                ) : matchStats ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Yellow Cards</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">2</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Red Cards</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">0</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Fouls Committed</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">{matchStats.firstHalf.foulsCommitted + matchStats.secondHalf.foulsCommitted}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Fouls Received</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">{matchStats.firstHalf.foulsReceived + matchStats.secondHalf.foulsReceived}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No statistics available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match Notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Match Notes</CardTitle>
              <Button
                onClick={() => setShowNotesModal(true)}
                variant="outline"
                size="sm"
              >
                Add Notes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {matchNotes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notes added for this match</p>
            ) : (
              <div className="space-y-2">
                {matchNotes.map((note, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{note.title}</span>
                      <span className="text-sm text-gray-500">{note.minute}'</span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Notes Modal */}
        <MatchNotesModal
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          matchId={selectedMatch.id}
          notes={matchNotes}
          onSaveNotes={setMatchNotes}
        />
      </div>
    );
  };

  const renderAddMatchForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Add New Match</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelAddMatch}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="homeTeam">Home Team *</Label>
            <Input
              id="homeTeam"
              value={newMatch.homeTeam}
              onChange={(e) => setNewMatch(prev => ({ ...prev, homeTeam: e.target.value }))}
              placeholder="Enter home team name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="awayTeam">Away Team *</Label>
            <Input
              id="awayTeam"
              value={newMatch.awayTeam}
              onChange={(e) => setNewMatch(prev => ({ ...prev, awayTeam: e.target.value }))}
              placeholder="Enter away team name"
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Match Date *</Label>
            <Input
              id="date"
              type="date"
              value={newMatch.date}
              onChange={(e) => setNewMatch(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="venue">Venue *</Label>
            <Input
              id="venue"
              value={newMatch.venue}
              onChange={(e) => setNewMatch(prev => ({ ...prev, venue: e.target.value }))}
              placeholder="Enter venue name"
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={newMatch.status} onValueChange={(value: 'completed' | 'upcoming') => setNewMatch(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newMatch.status === 'completed' && (
            <>
              <div>
                <Label htmlFor="homeScore">Home Score</Label>
                <Input
                  id="homeScore"
                  type="number"
                  min="0"
                  value={newMatch.homeScore}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, homeScore: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="awayScore">Away Score</Label>
                <Input
                  id="awayScore"
                  type="number"
                  min="0"
                  value={newMatch.awayScore}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, awayScore: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleCancelAddMatch}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMatch}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Match
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMatchList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('matches.title')}</h1>
        <Button
          onClick={() => setShowAddMatchForm(true)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Match</span>
        </Button>
      </div>
      
      {showAddMatchForm && renderAddMatchForm()}
      
      <div className="space-y-4">
        {matches.map((match) => (
          <Card
            key={match.id}
            onClick={() => setSelectedMatch(match)}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(match.date)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{match.venue}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  match.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {match.status === 'completed' ? t('matches.completed') : t('matches.upcoming')}
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold">
                  {match.homeTeam} vs {match.awayTeam}
                </h3>
                {match.status === 'completed' && (
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {match.homeScore} - {match.awayScore}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {selectedMatch ? renderMatchDetail() : renderMatchList()}
    </div>
  );
};

export default Matches;
