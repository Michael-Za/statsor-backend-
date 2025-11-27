import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Star, 
  Award, 
  TrendingUp, 
  Users, 
  Target, 
  Shield, 
  Zap,
  Trophy,
  Medal,
  Crown,
  Flame,
  BookOpen,
  MessageCircle,
  ThumbsUp,
  Flag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserReputation {
  user_id: string;
  score: number;
  badges: string[];
  level: number;
  next_level_points: number;
  total_contributions: number;
  helpful_votes: number;
  verified_tips: number;
  flags_received: number;
  created_at: string;
  updated_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirements: {
    type: string;
    threshold: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ReputationActivity {
  id: string;
  user_id: string;
  action_type: string;
  points_change: number;
  reason: string;
  created_at: string;
}

const BADGES: Badge[] = [
  {
    id: 'drill_sergeant',
    name: 'Drill Sergeant',
    description: 'Shared 10+ training drills',
    icon: '🎯',
    color: 'bg-blue-100 text-blue-800',
    requirements: { type: 'drills_shared', threshold: 10 },
    rarity: 'common'
  },
  {
    id: 'tactical_guru',
    name: 'Tactical Guru',
    description: '5+ captain-approved tips',
    icon: '🧠',
    color: 'bg-purple-100 text-purple-800',
    requirements: { type: 'verified_tips', threshold: 5 },
    rarity: 'rare'
  },
  {
    id: 'community_hero',
    name: 'Community Hero',
    description: '100+ helpful votes received',
    icon: '🦸',
    color: 'bg-green-100 text-green-800',
    requirements: { type: 'helpful_votes', threshold: 100 },
    rarity: 'epic'
  },
  {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Mastered all skill categories',
    icon: '👑',
    color: 'bg-yellow-100 text-yellow-800',
    requirements: { type: 'skill_categories', threshold: 4 },
    rarity: 'legendary'
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Helped 50+ players improve',
    icon: '🎓',
    color: 'bg-indigo-100 text-indigo-800',
    requirements: { type: 'players_helped', threshold: 50 },
    rarity: 'rare'
  },
  {
    id: 'content_creator',
    name: 'Content Creator',
    description: 'Created 25+ video tutorials',
    icon: '📹',
    color: 'bg-red-100 text-red-800',
    requirements: { type: 'videos_created', threshold: 25 },
    rarity: 'epic'
  }
];

export const ReputationSystem: React.FC = () => {
  const { user } = useAuth();
  const [userReputation, setUserReputation] = useState<UserReputation | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserReputation[]>([]);
  const [recentActivity, setRecentActivity] = useState<ReputationActivity[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>(BADGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserReputation();
      loadLeaderboard();
      loadRecentActivity();
    }
  }, [user]);

  const loadUserReputation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUserReputation(data);
      } else {
        // Create initial reputation record
        const initialReputation = {
          user_id: user.id,
          score: 0,
          badges: [],
          level: 1,
          next_level_points: 100,
          total_contributions: 0,
          helpful_votes: 0,
          verified_tips: 0,
          flags_received: 0
        };

        const { data: newData, error: insertError } = await supabase
          .from('user_reputation')
          .insert(initialReputation)
          .select()
          .single();

        if (insertError) throw insertError;
        setUserReputation(newData);
      }
    } catch (error) {
      console.error('Error loading user reputation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('user_reputation')
        .select(`
          *,
          users (
            name,
            picture
          )
        `)
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;

      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const loadRecentActivity = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reputation_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const calculateLevel = (score: number): { level: number; nextLevelPoints: number; progress: number } => {
    // Level calculation: Level 1 = 0-99, Level 2 = 100-299, Level 3 = 300-599, etc.
    const level = Math.floor(Math.sqrt(score / 100)) + 1;
    const currentLevelMin = Math.pow(level - 1, 2) * 100;
    const nextLevelMin = Math.pow(level, 2) * 100;
    const progress = ((score - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
    
    return {
      level,
      nextLevelPoints: nextLevelMin - score,
      progress: Math.min(progress, 100)
    };
  };

  const checkForNewBadges = (reputation: UserReputation): string[] => {
    const newBadges: string[] = [];
    
    BADGES.forEach(badge => {
      if (reputation.badges.includes(badge.id)) return;
      
      let qualifies = false;
      
      switch (badge.requirements.type) {
        case 'drills_shared':
          qualifies = reputation.total_contributions >= badge.requirements.threshold;
          break;
        case 'verified_tips':
          qualifies = reputation.verified_tips >= badge.requirements.threshold;
          break;
        case 'helpful_votes':
          qualifies = reputation.helpful_votes >= badge.requirements.threshold;
          break;
        // Add more badge requirements as needed
      }
      
      if (qualifies) {
        newBadges.push(badge.id);
      }
    });
    
    return newBadges;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getLevelIcon = (level: number) => {
    if (level >= 50) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (level >= 25) return <Trophy className="w-6 h-6 text-purple-500" />;
    if (level >= 10) return <Medal className="w-6 h-6 text-blue-500" />;
    return <Star className="w-6 h-6 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userReputation) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">Reputation System</h3>
        <p className="text-gray-500">Start contributing to build your reputation!</p>
      </div>
    );
  }

  const levelInfo = calculateLevel(userReputation.score);

  return (
    <div className="space-y-6">
      {/* User Reputation Overview */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getLevelIcon(levelInfo.level)}
              <div>
                <h2 className="text-2xl font-bold">Level {levelInfo.level}</h2>
                <p className="text-blue-100">Reputation Score: {userReputation.score}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-blue-100 mb-1">
                Next Level: {levelInfo.nextLevelPoints} points
              </div>
              <div className="w-32">
                <Progress value={levelInfo.progress} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{userReputation.total_contributions}</div>
                <div className="text-sm text-gray-600">Contributions</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <ThumbsUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{userReputation.helpful_votes}</div>
                <div className="text-sm text-gray-600">Helpful Votes</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{userReputation.verified_tips}</div>
                <div className="text-sm text-gray-600">Verified Tips</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{userReputation.badges.length}</div>
                <div className="text-sm text-gray-600">Badges Earned</div>
              </CardContent>
            </Card>
          </div>

          {/* Earned Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Your Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userReputation.badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userReputation.badges.map(badgeId => {
                    const badge = BADGES.find(b => b.id === badgeId);
                    if (!badge) return null;
                    
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-lg border-2 ${getRarityColor(badge.rarity)}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{badge.icon}</div>
                          <div>
                            <h4 className="font-semibold">{badge.name}</h4>
                            <p className="text-sm text-gray-600">{badge.description}</p>
                            <Badge className={`mt-1 ${badge.color}`}>
                              {badge.rarity}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No badges earned yet. Start contributing to unlock badges!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Available Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BADGES.filter(badge => !userReputation.badges.includes(badge.id)).map(badge => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border-2 opacity-60 ${getRarityColor(badge.rarity)}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl grayscale">{badge.icon}</div>
                      <div>
                        <h4 className="font-semibold">{badge.name}</h4>
                        <p className="text-sm text-gray-600">{badge.description}</p>
                        <Badge className={`mt-1 ${badge.color} opacity-75`}>
                          {badge.rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((player, index) => (
                  <div
                    key={player.user_id}
                    className={`flex items-center space-x-3 p-2 rounded ${
                      player.user_id === user?.id ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {(player as any).users?.name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Level {calculateLevel(player.score).level}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-sm">{player.score}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{activity.reason}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`font-bold ${
                      activity.points_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.points_change > 0 ? '+' : ''}{activity.points_change}
                    </div>
                  </div>
                ))}
                
                {recentActivity.length === 0 && (
                  <div className="text-center py-4">
                    <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reputation Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Earn Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Share a drill</span>
                  <span className="text-green-600 font-medium">+1</span>
                </div>
                <div className="flex justify-between">
                  <span>Verified tip</span>
                  <span className="text-green-600 font-medium">+5</span>
                </div>
                <div className="flex justify-between">
                  <span>Helpful vote</span>
                  <span className="text-green-600 font-medium">+1</span>
                </div>
                <div className="flex justify-between">
                  <span>Complete skill swap</span>
                  <span className="text-green-600 font-medium">+3</span>
                </div>
                <div className="flex justify-between">
                  <span>Flagged content</span>
                  <span className="text-red-600 font-medium">-3</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReputationSystem;