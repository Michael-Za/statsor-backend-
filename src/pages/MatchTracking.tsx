import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Calendar, Target, Shield, Trophy, AlertTriangle, TrendingUp, Users, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Match {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  status: 'completed';
  statistics?: any;
}

const MatchTracking: React.FC = () => {
  const navigate = useNavigate();
  useTheme(); // Just call the hook without destructuring since we don't use the values
  
  const [latestMatch, setLatestMatch] = useState<Match | null>(null);
  const [previousMatches, setPreviousMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch match data from database
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('Please sign in to view match tracking');
          setLoading(false);
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
          setLoading(false);
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
          setLoading(false);
          return;
        }

        const teamId = teams[0]?.id;
        
        if (!teamId) {
          toast.error('Invalid team data. Please try again.');
          setLoading(false);
          return;
        }

        // Fetch completed matches for the team
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .eq('team_id', teamId)
          .eq('status', 'completed')
          .order('match_date', { ascending: false });

        if (error) {
          console.error('Error fetching matches:', error);
          toast.error('Error loading matches');
          setLoading(false);
          return;
        }

        // Transform database data
        const transformedMatches: Match[] = data.map((match: any) => ({
          id: match.id.toString(),
          date: match.match_date,
          homeTeam: match.home_team || 'Your Team',
          awayTeam: match.away_team || 'Opponent',
          homeScore: match.home_score || 0,
          awayScore: match.away_score || 0,
          venue: match.venue || match.location || 'TBD',
          status: 'completed',
          statistics: match.statistics || {}
        }));

        if (transformedMatches.length > 0) {
          setLatestMatch(transformedMatches[0] || null);
          setPreviousMatches(transformedMatches.slice(1));
        } else {
          setLatestMatch(null);
          setPreviousMatches([]);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast.error('Error loading matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Calculate match statistics
  const calculateMatchStats = (match: Match) => {
    const stats = match.statistics || {};
    
    return {
      performance: {
        possession: stats.possession || 50,
        shots: stats.shots || 0,
        shotsOnTarget: stats.shots_on_target || 0
      },
      attack: {
        goals: match.homeScore + match.awayScore,
        assists: stats.assists || 0,
        corners: stats.corners || 0
      },
      defense: {
        tackles: stats.tackles || 0,
        interceptions: stats.interceptions || 0,
        clearances: stats.clearances || 0
      },
      discipline: {
        yellowCards: stats.yellow_cards || 0,
        redCards: stats.red_cards || 0,
        fouls: stats.fouls || 0
      }
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const matchStats = latestMatch ? calculateMatchStats(latestMatch) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Match Tracking
            </h1>
          </div>
        </motion.div>

        {latestMatch ? (
          <>
            {/* Latest Match Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Latest Match Summary</span>
                    <Badge variant="secondary">Completed</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Match Info */}
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                      <Calendar className="h-8 w-8 text-blue-500 mb-2" />
                      <p className="text-lg font-semibold">{formatDate(latestMatch.date)}</p>
                      <p className="text-gray-600">{latestMatch.venue}</p>
                    </div>
                    
                    {/* Score */}
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-2">{latestMatch.homeTeam}</div>
                        <div className="text-5xl font-bold text-gray-900 my-4">
                          {latestMatch.homeScore} - {latestMatch.awayScore}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">{latestMatch.awayTeam}</div>
                      </div>
                    </div>
                    
                    {/* Result */}
                    <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg">
                      <Trophy className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-lg font-semibold text-green-700">
                        {latestMatch.homeScore > latestMatch.awayScore ? 'Victory' : 
                         latestMatch.homeScore < latestMatch.awayScore ? 'Defeat' : 'Draw'}
                      </p>
                      <p className="text-gray-600">+{latestMatch.homeScore > latestMatch.awayScore ? 3 : latestMatch.homeScore === latestMatch.awayScore ? 1 : 0} points</p>
                    </div>
                  </div>
                  
                  {/* Main Statistics */}
                  {matchStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{matchStats.attack.goals}</p>
                        <p className="text-sm text-gray-600">Total Goals</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <Shield className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{matchStats.defense.tackles}</p>
                        <p className="text-sm text-gray-600">Total Tackles</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg text-center">
                        <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{matchStats.discipline.fouls}</p>
                        <p className="text-sm text-gray-600">Total Fouls</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{matchStats.performance.possession}%</p>
                        <p className="text-sm text-gray-600">Possession</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Previous Matches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle>Previous Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {previousMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-semibold">{formatDate(match.date)}</p>
                          <p className="text-sm text-gray-600">{match.homeTeam} vs {match.awayTeam}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-bold">
                            {match.homeScore} - {match.awayScore}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/matches/${match.id}`)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Match Data Available</h3>
            <p className="text-gray-600 mb-6">Add matches to start tracking your team's performance.</p>
            <Button onClick={() => navigate('/matches')}>
              Go to Matches
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MatchTracking;