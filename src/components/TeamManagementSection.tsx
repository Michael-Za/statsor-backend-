import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import {
  Users,
  Settings,
  Trophy,
  Target,
  Shield,
  Zap,
  Star,
  Plus,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TeamInfo {
  name: string;
  founded: string;
  stadium: string;
  capacity: string;
  city: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  description: string;
}

interface Formation {
  id: string;
  name: string;
  formation: string;
  description: string;
  isActive: boolean;
}

interface TacticalSetting {
  id: string;
  name: string;
  value: string;
  category: 'attacking' | 'defending' | 'general';
}

export const TeamManagementSection: React.FC = () => {
  const { theme, isHighContrast } = useTheme();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  
  const [teamInfo, setTeamInfo] = useState<TeamInfo>({
    name: 'CD Statsor',
    founded: '1985',
    stadium: 'Estadio Municipal',
    capacity: '15,000',
    city: 'Statsor',
    country: 'Spain',
    website: 'www.cdstatsor.com',
    email: 'info@cdstatsor.com',
    phone: '+34 123 456 789',
    description: 'Professional football club founded in 1985, competing in the regional league with a focus on developing young talent and playing attractive football.'
  });

  const [formations, setFormations] = useState<Formation[]>([
    {
      id: '1',
      name: '4-3-3 Attacking',
      formation: '4-3-3',
      description: 'Offensive formation with wide wingers and attacking midfielder',
      isActive: true
    },
    {
      id: '2',
      name: '4-4-2 Classic',
      formation: '4-4-2',
      description: 'Balanced formation with two strikers and solid midfield',
      isActive: false
    },
    {
      id: '3',
      name: '3-5-2 Defensive',
      formation: '3-5-2',
      description: 'Defensive setup with wing-backs and compact midfield',
      isActive: false
    },
    {
      id: '4',
      name: '4-2-3-1 Modern',
      formation: '4-2-3-1',
      description: 'Modern formation with defensive midfielders and attacking midfielder',
      isActive: false
    }
  ]);

  const [tacticalSettings, setTacticalSettings] = useState<TacticalSetting[]>([
    { id: '1', name: 'Pressing Intensity', value: 'High', category: 'defending' },
    { id: '2', name: 'Attacking Style', value: 'Possession', category: 'attacking' },
    { id: '3', name: 'Defensive Line', value: 'Medium', category: 'defending' },
    { id: '4', name: 'Tempo', value: 'Fast', category: 'general' },
    { id: '5', name: 'Width', value: 'Wide', category: 'attacking' },
    { id: '6', name: 'Mentality', value: 'Attacking', category: 'general' }
  ]);

  const [newFormation, setNewFormation] = useState({
    name: '',
    formation: '',
    description: ''
  });

  const handleSaveTeamInfo = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleAddFormation = () => {
    if (newFormation.name && newFormation.formation) {
      const formation: Formation = {
        id: Date.now().toString(),
        name: newFormation.name,
        formation: newFormation.formation,
        description: newFormation.description,
        isActive: false
      };
      setFormations(prev => [...prev, formation]);
      setNewFormation({ name: '', formation: '', description: '' });
    }
  };

  const handleSetActiveFormation = (formationId: string) => {
    setFormations(prev => prev.map(f => ({
      ...f,
      isActive: f.id === formationId
    })));
  };

  const handleUpdateTacticalSetting = (id: string, value: string) => {
    setTacticalSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'attacking': return 'bg-red-100 text-red-800';
      case 'defending': return 'bg-blue-100 text-blue-800';
      case 'general': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'attacking': return <Target className="h-4 w-4" />;
      case 'defending': return <Shield className="h-4 w-4" />;
      case 'general': return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
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
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Team Management</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage team information, formations, and tactical settings
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active Season
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-50 m-4 mb-0">
              <TabsTrigger 
                value="info" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Team Info
              </TabsTrigger>
              <TabsTrigger 
                value="formations" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-700"
              >
                <Target className="h-4 w-4 mr-2" />
                Formations
              </TabsTrigger>
              <TabsTrigger 
                value="tactics" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Tactics
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-700"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="p-4 pt-0">
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Team Information</CardTitle>
                      <Button
                        onClick={() => isEditing ? handleSaveTeamInfo() : setIsEditing(true)}
                        className={isEditing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}
                      >
                        {isEditing ? (
                          <><Save className="h-4 w-4 mr-2" />Save</>
                        ) : (
                          <><Edit className="h-4 w-4 mr-2" />Edit</>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teamName">Team Name</Label>
                        <Input
                          id="teamName"
                          value={teamInfo.name}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="founded">Founded</Label>
                        <Input
                          id="founded"
                          value={teamInfo.founded}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, founded: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="stadium">Stadium</Label>
                        <Input
                          id="stadium"
                          value={teamInfo.stadium}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, stadium: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          value={teamInfo.capacity}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, capacity: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={teamInfo.city}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, city: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={teamInfo.country}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, country: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={teamInfo.website}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, website: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={teamInfo.email}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={teamInfo.phone}
                          onChange={(e) => setTeamInfo(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={teamInfo.description}
                        onChange={(e) => setTeamInfo(prev => ({ ...prev, description: e.target.value }))}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{teamInfo.founded}</div>
                      <div className="text-sm text-gray-600">Founded</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <MapPin className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{teamInfo.capacity}</div>
                      <div className="text-sm text-gray-600">Capacity</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <Globe className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">{teamInfo.city}</div>
                      <div className="text-sm text-gray-600">Location</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">25</div>
                      <div className="text-sm text-gray-600">Players</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="formations" className="p-4 pt-0">
              <div className="space-y-6">
                {/* Add New Formation */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Formation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="formationName">Formation Name</Label>
                        <Input
                          id="formationName"
                          value={newFormation.name}
                          onChange={(e) => setNewFormation(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., 4-3-3 Attacking"
                        />
                      </div>
                      <div>
                        <Label htmlFor="formationPattern">Formation Pattern</Label>
                        <Select value={newFormation.formation} onValueChange={(value) => setNewFormation(prev => ({ ...prev, formation: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select formation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4-3-3">4-3-3</SelectItem>
                            <SelectItem value="4-4-2">4-4-2</SelectItem>
                            <SelectItem value="3-5-2">3-5-2</SelectItem>
                            <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                            <SelectItem value="5-3-2">5-3-2</SelectItem>
                            <SelectItem value="3-4-3">3-4-3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="formationDescription">Description</Label>
                        <Input
                          id="formationDescription"
                          value={newFormation.description}
                          onChange={(e) => setNewFormation(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Formation description"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddFormation} className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Formation
                    </Button>
                  </CardContent>
                </Card>

                {/* Current Formations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formations.map((formation) => (
                    <Card key={formation.id} className={`${formation.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {formation.name}
                              {formation.isActive && (
                                <Badge className="ml-2 bg-green-500 text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{formation.description}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                              {formation.formation}
                            </div>
                            <div className="text-sm text-gray-600">Formation</div>
                          </div>
                          <div className="space-x-2">
                            {!formation.isActive && (
                              <Button
                                size="sm"
                                onClick={() => handleSetActiveFormation(formation.id)}
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tactics" className="p-4 pt-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tactical Settings</CardTitle>
                    <p className="text-sm text-gray-600">Configure your team's playing style and tactical approach</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {['attacking', 'defending', 'general'].map((category) => (
                        <div key={category}>
                          <div className="flex items-center space-x-2 mb-4">
                            {getCategoryIcon(category)}
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                              {category} Settings
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tacticalSettings
                              .filter(setting => setting.category === category)
                              .map((setting) => (
                                <Card key={setting.id} className="border-gray-200">
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium text-gray-700">
                                          {setting.name}
                                        </Label>
                                        <Badge className={getCategoryColor(setting.category)}>
                                          {setting.category}
                                        </Badge>
                                      </div>
                                      <Select 
                                        value={setting.value} 
                                        onValueChange={(value) => handleUpdateTacticalSetting(setting.id, value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {setting.name === 'Pressing Intensity' && (
                                            <>
                                              <SelectItem value="Low">Low</SelectItem>
                                              <SelectItem value="Medium">Medium</SelectItem>
                                              <SelectItem value="High">High</SelectItem>
                                            </>
                                          )}
                                          {setting.name === 'Attacking Style' && (
                                            <>
                                              <SelectItem value="Direct">Direct</SelectItem>
                                              <SelectItem value="Possession">Possession</SelectItem>
                                              <SelectItem value="Counter">Counter</SelectItem>
                                            </>
                                          )}
                                          {setting.name === 'Defensive Line' && (
                                            <>
                                              <SelectItem value="Low">Low</SelectItem>
                                              <SelectItem value="Medium">Medium</SelectItem>
                                              <SelectItem value="High">High</SelectItem>
                                            </>
                                          )}
                                          {setting.name === 'Tempo' && (
                                            <>
                                              <SelectItem value="Slow">Slow</SelectItem>
                                              <SelectItem value="Medium">Medium</SelectItem>
                                              <SelectItem value="Fast">Fast</SelectItem>
                                            </>
                                          )}
                                          {setting.name === 'Width' && (
                                            <>
                                              <SelectItem value="Narrow">Narrow</SelectItem>
                                              <SelectItem value="Medium">Medium</SelectItem>
                                              <SelectItem value="Wide">Wide</SelectItem>
                                            </>
                                          )}
                                          {setting.name === 'Mentality' && (
                                            <>
                                              <SelectItem value="Defensive">Defensive</SelectItem>
                                              <SelectItem value="Balanced">Balanced</SelectItem>
                                              <SelectItem value="Attacking">Attacking</SelectItem>
                                            </>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="p-4 pt-0">
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-6 w-6 text-yellow-600 mr-2" />
                      Team Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="text-center border-yellow-200">
                        <CardContent className="p-4">
                          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                          <div className="text-2xl font-bold text-gray-900 mb-1">3</div>
                          <div className="text-sm text-gray-600">League Titles</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="text-center border-silver-200">
                        <CardContent className="p-4">
                          <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <div className="text-2xl font-bold text-gray-900 mb-1">5</div>
                          <div className="text-sm text-gray-600">Cup Victories</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="text-center border-bronze-200">
                        <CardContent className="p-4">
                          <Target className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                          <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
                          <div className="text-sm text-gray-600">Tournament Wins</div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Trophy className="h-8 w-8 text-yellow-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Regional League Champions</div>
                          <div className="text-sm text-gray-600">Season 2023-2024</div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Champion</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Star className="h-8 w-8 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Best Defensive Record</div>
                          <div className="text-sm text-gray-600">Only 15 goals conceded in 30 matches</div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Record</Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Target className="h-8 w-8 text-green-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Top Scorer Award</div>
                          <div className="text-sm text-gray-600">Player scored 25 goals this season</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Individual</Badge>
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