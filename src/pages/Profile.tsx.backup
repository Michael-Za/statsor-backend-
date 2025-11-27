import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  User,
  Camera,
  Edit3,
  Save,
  RefreshCw,
  Trophy,
  Target,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Star,
  TrendingUp,
  Activity,
  Award,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    bio: 'Passionate football player and team strategist. Always looking to improve and help the team succeed.',
    position: 'Midfielder',
    jerseyNumber: '10',
    joinDate: '2024-01-15',
    height: '5\'10"',
    weight: '165 lbs',
    preferredFoot: 'Right'
  });

  // Mock statistics data
  const stats = {
    matchesPlayed: 24,
    goals: 8,
    assists: 12,
    yellowCards: 3,
    redCards: 0,
    minutesPlayed: 1980,
    passAccuracy: 87,
    shotsOnTarget: 65,
    tacklesWon: 78,
    rating: 8.2
  };

  const achievements = [
    { title: 'Top Scorer', description: 'Most goals in March 2024', icon: Trophy, color: 'text-yellow-500' },
    { title: 'Team Player', description: 'Most assists this season', icon: Users, color: 'text-blue-500' },
    { title: 'Consistent Performer', description: '10 consecutive matches played', icon: Target, color: 'text-green-500' },
    { title: 'Rising Star', description: 'Improved rating by 15%', icon: TrendingUp, color: 'text-purple-500' }
  ];

  const recentMatches = [
    { date: '2024-01-20', opponent: 'FC Barcelona', result: 'W 2-1', rating: 8.5, goals: 1, assists: 0 },
    { date: '2024-01-15', opponent: 'Real Madrid', result: 'L 1-3', rating: 7.8, goals: 0, assists: 1 },
    { date: '2024-01-10', opponent: 'Atletico Madrid', result: 'W 3-0', rating: 9.2, goals: 2, assists: 1 },
    { date: '2024-01-05', opponent: 'Valencia CF', result: 'D 1-1', rating: 7.5, goals: 0, assists: 0 },
    { date: '2024-01-01', opponent: 'Sevilla FC', result: 'W 2-0', rating: 8.8, goals: 1, assists: 1 }
  ];

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile(profileData);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // In a real app, you'd upload to a server
        toast.success('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const getResultColor = (result: string) => {
    if (result.startsWith('W')) return 'text-green-500';
    if (result.startsWith('L')) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text-primary mb-2">My Profile</h1>
        <p className="text-gray-400">Manage your profile information and view your performance statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <div className="relative mx-auto mb-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-2xl">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={14} />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <CardTitle className="text-xl">{profileData.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                <MapPin size={14} />
                {profileData.location}
              </CardDescription>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="secondary">#{profileData.jerseyNumber}</Badge>
                <Badge variant="outline">{profileData.position}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats.rating}</div>
                <div className="text-sm text-gray-400">Overall Rating</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">{stats.matchesPlayed}</div>
                  <div className="text-xs text-gray-400">Matches</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{stats.goals}</div>
                  <div className="text-xs text-gray-400">Goals</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{stats.assists}</div>
                  <div className="text-xs text-gray-400">Assists</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{stats.passAccuracy}%</div>
                  <div className="text-xs text-gray-400">Pass Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pass Accuracy</span>
                  <span>{stats.passAccuracy}%</span>
                </div>
                <Progress value={stats.passAccuracy} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Shots on Target</span>
                  <span>{stats.shotsOnTarget}%</span>
                </div>
                <Progress value={stats.shotsOnTarget} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tackles Won</span>
                  <span>{stats.tacklesWon}%</span>
                </div>
                <Progress value={stats.tacklesWon} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <User size={16} />
                Info
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 size={16} />
                Stats
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <Calendar size={16} />
                Matches
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Award size={16} />
                Awards
              </TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="info" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </div>
                  <Button
                    variant={editing ? "default" : "outline"}
                    onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : editing ? (
                      <Save className="mr-2 h-4 w-4" />
                    ) : (
                      <Edit3 className="mr-2 h-4 w-4" />
                    )}
                    {editing ? 'Save' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={!editing}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!editing}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!editing}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        disabled={!editing}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={profileData.position}
                        onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                        disabled={!editing}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jerseyNumber">Jersey Number</Label>
                      <Input
                        id="jerseyNumber"
                        value={profileData.jerseyNumber}
                        onChange={(e) => setProfileData({ ...profileData, jerseyNumber: e.target.value })}
                        disabled={!editing}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        value={profileData.height}
                        onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                        disabled={!editing}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        value={profileData.weight}
                        onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                        disabled={!editing}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      disabled={!editing}
                      className="bg-gray-700 border-gray-600"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics */}
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{stats.goals}</div>
                    <div className="text-sm text-gray-400">Goals Scored</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{stats.assists}</div>
                    <div className="text-sm text-gray-400">Assists</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{stats.minutesPlayed}</div>
                    <div className="text-sm text-gray-400">Minutes Played</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{stats.passAccuracy}%</div>
                    <div className="text-sm text-gray-400">Pass Accuracy</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold">{stats.yellowCards}</div>
                    <div className="text-sm text-gray-400">Yellow Cards</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <Star className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{stats.rating}</div>
                    <div className="text-sm text-gray-400">Average Rating</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recent Matches */}
            <TabsContent value="matches" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Recent Matches</CardTitle>
                  <CardDescription>Your performance in the last 5 matches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMatches.map((match, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-400">{match.date}</div>
                          <div className="font-medium">{match.opponent}</div>
                          <Badge className={getResultColor(match.result)}>
                            {match.result}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{match.goals}</div>
                            <div className="text-gray-400">Goals</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{match.assists}</div>
                            <div className="text-gray-400">Assists</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-500">{match.rating}</div>
                            <div className="text-gray-400">Rating</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements */}
            <TabsContent value="achievements" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => {
                  const IconComponent = achievement.icon;
                  return (
                    <Card key={index} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg bg-gray-700 ${achievement.color}`}>
                            <IconComponent size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{achievement.title}</h3>
                            <p className="text-sm text-gray-400">{achievement.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;