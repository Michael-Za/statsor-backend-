import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Target, 
  Activity, 
  Heart, 
  Award,
  User,
  Phone,
  Mail,
  Edit,
  Save,
  Camera,
  X,
  Plus,
  Minus,
  Footprints,
  Shield,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { dataManagementService, Player as DataPlayer } from '../services/dataManagementService';
import { playerManagementService } from '../services/playerManagementService';

// Define our extended player interface
// We're extending the base Player interface but only adding truly new properties
interface ExtendedPlayer extends DataPlayer {
  // No additional properties needed as they're already in the base Player interface
}

const PlayerProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [player, setPlayer] = useState<ExtendedPlayer | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editedPlayer, setEditedPlayer] = useState<ExtendedPlayer | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  
  // Scoring areas state
  const [scoringAreas, setScoringAreas] = useState<number[][]>(Array(3).fill(null).map(() => Array(3).fill(0)));
  const [activeTab, setActiveTab] = useState<'offensive' | 'defensive' | 'scoring'>('offensive');

  // Mock performance data for the chart
  const performanceData = [
    { game: 'Match 1', goals: 1, assists: 0 },
    { game: 'Match 2', goals: 0, assists: 1 },
    { game: 'Match 3', goals: 2, assists: 1 },
    { game: 'Match 4', goals: 0, assists: 2 },
    { game: 'Match 5', goals: 1, assists: 0 },
  ];

  useEffect(() => {
    const loadPlayer = async () => {
      if (!id) {
        navigate('/players');
        return;
      }
      
      try {
        setLoading(true);
        const players = await dataManagementService.getPlayers();
        const foundPlayer = players.find(p => p.id === id);
        
        if (foundPlayer) {
          // Transform the player data to match our interface
          const transformedPlayer: ExtendedPlayer = {
            ...foundPlayer,
            number: foundPlayer.jersey_number ?? Math.floor(Math.random() * 99) + 1,
            ...(foundPlayer.nickname !== undefined && { nickname: foundPlayer.nickname }),
            ...(foundPlayer.secondaryPositions !== undefined && { secondaryPositions: foundPlayer.secondaryPositions }),
            dominantFoot: foundPlayer.preferred_foot || 'Right',
            // Fix: Only include birthDate if it's not undefined to satisfy exactOptionalPropertyTypes
            ...(foundPlayer.birthDate !== undefined && { birthDate: foundPlayer.birthDate }),
            // Handle date_of_birth transformation
            ...(foundPlayer.date_of_birth && { birthDate: new Date(foundPlayer.date_of_birth) }),
            ...(foundPlayer.games !== undefined && { games: foundPlayer.games }),
            ...(foundPlayer.yellowCards !== undefined && { yellowCards: foundPlayer.yellowCards }),
            ...(foundPlayer.redCards !== undefined && { redCards: foundPlayer.redCards }),
            ...(foundPlayer.shots !== undefined && { shots: foundPlayer.shots }),
            ...(foundPlayer.shotsOnTarget !== undefined && { shotsOnTarget: foundPlayer.shotsOnTarget }),
            ...(foundPlayer.passes !== undefined && { passes: foundPlayer.passes }),
            ...(foundPlayer.passAccuracy !== undefined && { passAccuracy: foundPlayer.passAccuracy }),
            ...(foundPlayer.foulsCommitted !== undefined && { foulsCommitted: foundPlayer.foulsCommitted }),
            ...(foundPlayer.foulsReceived !== undefined && { foulsReceived: foundPlayer.foulsReceived }),
            ...(foundPlayer.ballsLost !== undefined && { ballsLost: foundPlayer.ballsLost }),
            ...(foundPlayer.ballsRecovered !== undefined && { ballsRecovered: foundPlayer.ballsRecovered }),
            ...(foundPlayer.duelsWon !== undefined && { duelsWon: foundPlayer.duelsWon }),
            ...(foundPlayer.duelsLost !== undefined && { duelsLost: foundPlayer.duelsLost }),
            ...(foundPlayer.crosses !== undefined && { crosses: foundPlayer.crosses }),
            ...(foundPlayer.saves !== undefined && { saves: foundPlayer.saves }),
            photo: foundPlayer.photo_url || '/placeholder.svg',
            ...(foundPlayer.shotMap !== undefined && { shotMap: foundPlayer.shotMap }),
            ...(foundPlayer.height !== undefined && { height: foundPlayer.height }),
            ...(foundPlayer.weight !== undefined && { weight: foundPlayer.weight }),
            ...(foundPlayer.goals !== undefined && { goals: foundPlayer.goals }),
            ...(foundPlayer.assists !== undefined && { assists: foundPlayer.assists }),
            ...(foundPlayer.minutes !== undefined && { minutes: foundPlayer.minutes })
          };
          
          setPlayer(transformedPlayer);
          setEditedPlayer(transformedPlayer);
        } else {
          toast.error('Player not found');
          navigate('/players');
        }
      } catch (error) {
        console.error('Error loading player:', error);
        toast.error('Failed to load player data');
        navigate('/players');
      } finally {
        setLoading(false);
      }
    };
    
    loadPlayer();
    
    // Load scoring areas data from localStorage
    const savedScoringAreas = localStorage.getItem(`player_${id}_scoring_areas`);
    if (savedScoringAreas) {
      try {
        setScoringAreas(JSON.parse(savedScoringAreas));
      } catch (e) {
        console.error('Failed to parse scoring areas data', e);
      }
    }
    
    // Subscribe to player updates
    const unsubscribe = playerManagementService.onPlayersUpdated(async () => {
      if (id) {
        const updatedPlayer = await dataManagementService.getPlayer(id);
        if (updatedPlayer) {
          // Transform the player data to match our interface
          const transformedPlayer: ExtendedPlayer = {
            ...updatedPlayer,
            number: updatedPlayer.jersey_number ?? Math.floor(Math.random() * 99) + 1,
            ...(updatedPlayer.nickname !== undefined && { nickname: updatedPlayer.nickname }),
            ...(updatedPlayer.secondaryPositions !== undefined && { secondaryPositions: updatedPlayer.secondaryPositions }),
            dominantFoot: updatedPlayer.preferred_foot || 'Right',
            // Handle date_of_birth transformation
            ...(updatedPlayer.date_of_birth && { birthDate: new Date(updatedPlayer.date_of_birth) }),
            // Handle existing birthDate
            ...(updatedPlayer.birthDate !== undefined && { birthDate: updatedPlayer.birthDate }),
            ...(updatedPlayer.games !== undefined && { games: updatedPlayer.games }),
            ...(updatedPlayer.yellowCards !== undefined && { yellowCards: updatedPlayer.yellowCards }),
            ...(updatedPlayer.redCards !== undefined && { redCards: updatedPlayer.redCards }),
            ...(updatedPlayer.shots !== undefined && { shots: updatedPlayer.shots }),
            ...(updatedPlayer.shotsOnTarget !== undefined && { shotsOnTarget: updatedPlayer.shotsOnTarget }),
            ...(updatedPlayer.passes !== undefined && { passes: updatedPlayer.passes }),
            ...(updatedPlayer.passAccuracy !== undefined && { passAccuracy: updatedPlayer.passAccuracy }),
            ...(updatedPlayer.foulsCommitted !== undefined && { foulsCommitted: updatedPlayer.foulsCommitted }),
            ...(updatedPlayer.foulsReceived !== undefined && { foulsReceived: updatedPlayer.foulsReceived }),
            ...(updatedPlayer.ballsLost !== undefined && { ballsLost: updatedPlayer.ballsLost }),
            ...(updatedPlayer.ballsRecovered !== undefined && { ballsRecovered: updatedPlayer.ballsRecovered }),
            ...(updatedPlayer.duelsWon !== undefined && { duelsWon: updatedPlayer.duelsWon }),
            ...(updatedPlayer.duelsLost !== undefined && { duelsLost: updatedPlayer.duelsLost }),
            ...(updatedPlayer.crosses !== undefined && { crosses: updatedPlayer.crosses }),
            ...(updatedPlayer.saves !== undefined && { saves: updatedPlayer.saves }),
            photo: updatedPlayer.photo_url || '/placeholder.svg',
            ...(updatedPlayer.shotMap !== undefined && { shotMap: updatedPlayer.shotMap }),
            ...(updatedPlayer.height !== undefined && { height: updatedPlayer.height }),
            ...(updatedPlayer.weight !== undefined && { weight: updatedPlayer.weight }),
            ...(updatedPlayer.goals !== undefined && { goals: updatedPlayer.goals }),
            ...(updatedPlayer.assists !== undefined && { assists: updatedPlayer.assists }),
            ...(updatedPlayer.minutes !== undefined && { minutes: updatedPlayer.minutes })
          };
          
          setPlayer(transformedPlayer);
          setEditedPlayer(transformedPlayer);
        }
      }
    });
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id, navigate]);

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'DEL': return 'bg-red-100 text-red-800';
      case 'CEN': return 'bg-blue-100 text-blue-800';
      case 'DEF': return 'bg-green-100 text-green-800';
      case 'POR': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedPlayer(player);
  };

  const handleSave = async () => {
    if (!editedPlayer || !player || !player.id) {
      toast.error('Invalid player data');
      return;
    }

    const loadingToast = toast.loading('Updating player profile...');

    try {
      // Prepare player data for update
      const playerData: any = {
        name: editedPlayer.name,
        position: editedPlayer.position,
        preferred_foot: editedPlayer.dominantFoot
      };

      // Only add properties that are not undefined
      if (editedPlayer.number !== undefined) playerData.jersey_number = editedPlayer.number;
      if (editedPlayer.age !== undefined) playerData.age = editedPlayer.age;
      if (editedPlayer.nationality !== undefined) playerData.nationality = editedPlayer.nationality;
      if (editedPlayer.height !== undefined) playerData.height = editedPlayer.height;
      if (editedPlayer.weight !== undefined) playerData.weight = editedPlayer.weight;
      if (editedPlayer.photo !== undefined) playerData.photo_url = editedPlayer.photo;
      
      // Handle date_of_birth separately
      if (editedPlayer.birthDate) {
        playerData.date_of_birth = editedPlayer.birthDate.toISOString().split('T')[0];
      } else if (editedPlayer.birthDate === null || editedPlayer.birthDate === undefined) {
        playerData.date_of_birth = null;
      }

      console.log('Saving player data:', playerData);

      const updatedPlayer = await dataManagementService.updatePlayer(player.id, playerData);

      if (updatedPlayer) {
        // Transform the updated player data to match our interface
        const transformedPlayer: ExtendedPlayer = {
          ...updatedPlayer,
          number: updatedPlayer.jersey_number ?? Math.floor(Math.random() * 99) + 1,
          ...(updatedPlayer.nickname !== undefined && { nickname: updatedPlayer.nickname }),
          ...(updatedPlayer.secondaryPositions !== undefined && { secondaryPositions: updatedPlayer.secondaryPositions }),
          dominantFoot: updatedPlayer.preferred_foot || 'Right',
          // Handle date_of_birth transformation
          ...(updatedPlayer.date_of_birth && { birthDate: new Date(updatedPlayer.date_of_birth) }),
          // Handle existing birthDate
          ...(updatedPlayer.birthDate !== undefined && { birthDate: updatedPlayer.birthDate }),
          ...(updatedPlayer.games !== undefined && { games: updatedPlayer.games }),
          ...(updatedPlayer.yellowCards !== undefined && { yellowCards: updatedPlayer.yellowCards }),
          ...(updatedPlayer.redCards !== undefined && { redCards: updatedPlayer.redCards }),
          ...(updatedPlayer.shots !== undefined && { shots: updatedPlayer.shots }),
          ...(updatedPlayer.shotsOnTarget !== undefined && { shotsOnTarget: updatedPlayer.shotsOnTarget }),
          ...(updatedPlayer.passes !== undefined && { passes: updatedPlayer.passes }),
          ...(updatedPlayer.passAccuracy !== undefined && { passAccuracy: updatedPlayer.passAccuracy }),
          ...(updatedPlayer.foulsCommitted !== undefined && { foulsCommitted: updatedPlayer.foulsCommitted }),
          ...(updatedPlayer.foulsReceived !== undefined && { foulsReceived: updatedPlayer.foulsReceived }),
          ...(updatedPlayer.ballsLost !== undefined && { ballsLost: updatedPlayer.ballsLost }),
          ...(updatedPlayer.ballsRecovered !== undefined && { ballsRecovered: updatedPlayer.ballsRecovered }),
          ...(updatedPlayer.duelsWon !== undefined && { duelsWon: updatedPlayer.duelsWon }),
          ...(updatedPlayer.duelsLost !== undefined && { duelsLost: updatedPlayer.duelsLost }),
          ...(updatedPlayer.crosses !== undefined && { crosses: updatedPlayer.crosses }),
          ...(updatedPlayer.saves !== undefined && { saves: updatedPlayer.saves }),
          photo: updatedPlayer.photo_url || '/placeholder.svg',
          ...(updatedPlayer.shotMap !== undefined && { shotMap: updatedPlayer.shotMap }),
          ...(updatedPlayer.height !== undefined && { height: updatedPlayer.height }),
          ...(updatedPlayer.weight !== undefined && { weight: updatedPlayer.weight }),
          ...(updatedPlayer.goals !== undefined && { goals: updatedPlayer.goals }),
          ...(updatedPlayer.assists !== undefined && { assists: updatedPlayer.assists }),
          ...(updatedPlayer.minutes !== undefined && { minutes: updatedPlayer.minutes })
        };

        setPlayer(transformedPlayer);
        setEditedPlayer(transformedPlayer);
        setIsEditing(false);

        if (tempPhoto) {
          const playerPhotos = JSON.parse(localStorage.getItem('player_photos') || '{}');
          playerPhotos[player.id] = tempPhoto;
          localStorage.setItem('player_photos', JSON.stringify(playerPhotos));
          setPlayer(prev => prev ? { ...prev, photo: tempPhoto } : null);
          setEditedPlayer(prev => prev ? { ...prev, photo: tempPhoto } : null);
          setTempPhoto(null);
        }

        toast.dismiss(loadingToast);
        toast.success('Player profile updated successfully!');
      } else {
        toast.dismiss(loadingToast);
        toast.error('Failed to update player profile - no response from server');
      }
    } catch (error: any) {
      console.error('Error updating player:', error);
      toast.dismiss(loadingToast);
      toast.error(error?.message || 'Failed to update player profile. Please check your connection and try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPlayer(player);
    setTempPhoto(null);
  };

  const updateScoringArea = (row: number, col: number, increment: number) => {
    if (!id) return;
    
    setScoringAreas(prevAreas => {
      const newAreas = prevAreas.map(r => [...r]); // Create a deep copy
      const currentRow = newAreas[row] ?? [];
      const currentValue = currentRow[col] ?? 0;
      const newValue = Math.max(0, currentValue + increment);
      
      if (!newAreas[row]) {
        newAreas[row] = [];
      }
      newAreas[row][col] = newValue;
      localStorage.setItem(`player_${id}_scoring_areas`, JSON.stringify(newAreas));
      return newAreas;
    });
  };

  const resetScoringAreas = () => {
    if (!id) return;
    
    const resetAreas = Array(3).fill(null).map(() => Array(3).fill(0));
    setScoringAreas(resetAreas);
    localStorage.setItem(`player_${id}_scoring_areas`, JSON.stringify(resetAreas));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/players')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Players
        </Button>
        {!isEditing ? (
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit size={16} />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save size={16} />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Info Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarImage src={tempPhoto || editedPlayer?.photo || '/placeholder.svg'} alt={editedPlayer?.name || 'Player'} />
                    <AvatarFallback className="text-2xl bg-blue-500 text-white">
                      {(editedPlayer?.name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="absolute bottom-4 right-0 w-8 h-8 p-0 rounded-full"
                      size="sm"
                    >
                      <Camera size={16} />
                    </Button>
                  )}
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        setTempPhoto(base64);
                        setEditedPlayer(prev => {
                          if (!prev) return null;
                          return { ...prev, photo: base64 };
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                {isEditing && editedPlayer ? (
                  <Input
                    value={editedPlayer.name || ''}
                    onChange={(e) => setEditedPlayer(prev => {
                      if (!prev) return null;
                      return { ...prev, name: e.target.value };
                    })}
                    className="text-2xl text-center font-bold"
                  />
                ) : (
                  <CardTitle className="text-2xl text-center">{player?.name || 'Loading...'}</CardTitle>
                )}
                {isEditing && editedPlayer ? (
                  <Input
                    value={editedPlayer.nickname || ''}
                    onChange={(e) => setEditedPlayer(prev => {
                      if (!prev) return null;
                      return { ...prev, nickname: e.target.value };
                    })}
                    placeholder="Nickname"
                    className="text-muted-foreground text-center"
                  />
                ) : (
                  <p className="text-muted-foreground text-center">
                    {player?.nickname && player.nickname !== '' ? `"${player.nickname}"` : ''}
                  </p>
                )}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge className={`${getPositionColor(player?.position || '')} px-3 py-1`}>
                    {player?.position || 'N/A'}
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    #{player?.number || 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Age</Label>
                    {isEditing && editedPlayer ? (
                      <Input
                        type="number"
                        value={editedPlayer.age || ''}
                        onChange={(e) => setEditedPlayer(prev => {
                          if (!prev) return null;
                          const value = e.target.value ? parseInt(e.target.value) : NaN;
                          return prev ? ({ ...prev, age: isNaN(value) ? undefined : value } as ExtendedPlayer) : null;
                        })}
                      />
                    ) : (
                      <p className="font-medium">{player?.age || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nationality</Label>
                    {isEditing && editedPlayer ? (
                      <Input
                        value={editedPlayer.nationality || ''}
                        onChange={(e) => setEditedPlayer(prev => {
                          if (!prev) return null;
                          return { ...prev, nationality: e.target.value };
                        })}
                      />
                    ) : (
                      <p className="font-medium">{player?.nationality || 'N/A'}</p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Height (cm)</Label>
                    {isEditing && editedPlayer ? (
                      <Input
                        type="number"
                        value={editedPlayer.height || ''}
                        onChange={(e) => setEditedPlayer(prev => {
                          if (!prev) return null;
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          return prev ? ({ ...prev, height: value } as ExtendedPlayer) : null;
                        })}
                      />
                    ) : (
                      <p className="font-medium">{player?.height ? `${player.height} cm` : 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                    {isEditing && editedPlayer ? (
                      <Input
                        type="number"
                        value={editedPlayer.weight || ''}
                        onChange={(e) => setEditedPlayer(prev => {
                          if (!prev) return null;
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          return prev ? ({ ...prev, weight: value } as ExtendedPlayer) : null;
                        })}
                      />
                    ) : (
                      <p className="font-medium">{player?.weight ? `${player.weight} kg` : 'N/A'}</p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-xs text-muted-foreground">Dominant Foot</Label>
                  {isEditing && editedPlayer ? (
                    <Select 
                      value={editedPlayer.dominantFoot || 'Right'} 
                      onValueChange={(value) => setEditedPlayer(prev => {
                        if (!prev) return null;
                        return { ...prev, dominantFoot: value };
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Right">Right</SelectItem>
                        <SelectItem value="Left">Left</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{player?.dominantFoot || 'N/A'}</p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-xs text-muted-foreground">Secondary Positions</Label>
                  {isEditing && editedPlayer ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {editedPlayer.secondaryPositions?.map((pos, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {pos}
                          <button 
                            onClick={() => {
                              const newPositions = [...(editedPlayer.secondaryPositions || [])];
                              newPositions.splice(index, 1);
                              setEditedPlayer(prev => {
                                if (!prev) return null;
                                return { ...prev, secondaryPositions: newPositions };
                              });
                            }}
                            className="ml-1 hover:bg-red-100 rounded-full"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      ))}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          const newPos = prompt('Enter new position:');
                          if (newPos) {
                            setEditedPlayer(prev => {
                              if (!prev) return null;
                              return { 
                                ...prev, 
                                secondaryPositions: [...(prev.secondaryPositions || []), newPos] 
                              };
                            });
                          }
                        }}
                        className="h-6 text-xs"
                      >
                        <Plus size={12} className="mr-1" /> Add
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {player?.secondaryPositions?.map((pos, index) => (
                        <Badge key={index} variant="outline">
                          {pos}
                        </Badge>
                      )) || <p className="text-muted-foreground">None</p>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Stats and Performance Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex space-x-4 border-b">
                  <Button
                    variant={activeTab === 'offensive' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('offensive')}
                  >
                    Offensive
                  </Button>
                  <Button
                    variant={activeTab === 'defensive' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('defensive')}
                  >
                    Defensive
                  </Button>
                  <Button
                    variant={activeTab === 'scoring' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('scoring')}
                  >
                    Scoring Areas
                  </Button>
                </div>
              </div>
              
              {activeTab === 'offensive' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-blue-600">Goals</p>
                      {isEditing && editedPlayer ? (
                        <Input
                          type="number"
                          value={editedPlayer.goals || 0}
                          onChange={(e) => setEditedPlayer(prev => {
                            if (!prev) return null;
                            const value = e.target.value ? parseInt(e.target.value) : 0;
                            return { ...prev, goals: value };
                          })}
                          className="text-2xl font-bold text-blue-900 text-center"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-blue-900">{player?.goals || 0}</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-600">Assists</p>
                      {isEditing && editedPlayer ? (
                        <Input
                          type="number"
                          value={editedPlayer.assists || 0}
                          onChange={(e) => setEditedPlayer(prev => {
                            if (!prev) return null;
                            const value = e.target.value ? parseInt(e.target.value) : 0;
                            return { ...prev, assists: value };
                          })}
                          className="text-2xl font-bold text-green-900 text-center"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-green-900">{player?.assists || 0}</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Footprints className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm text-purple-600">Shots</p>
                      <p className="text-2xl font-bold text-purple-900">{player?.shots || 0}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4 text-center">
                      <Activity className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm text-orange-600">Pass Accuracy</p>
                      <p className="text-2xl font-bold text-orange-900">{player?.passAccuracy || 0}%</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'defensive' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4 text-center">
                      <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-600">Tackles Won</p>
                      <p className="text-2xl font-bold text-red-900">{player?.duelsWon || 0}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4 text-center">
                      <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-yellow-600">Yellow Cards</p>
                      <p className="text-2xl font-bold text-yellow-900">{player?.yellowCards || 0}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4 text-center">
                      <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-600">Red Cards</p>
                      <p className="text-2xl font-bold text-red-900">{player?.redCards || 0}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-blue-600">Balls Recovered</p>
                      <p className="text-2xl font-bold text-blue-900">{player?.ballsRecovered || 0}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'scoring' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Scoring Zones Heatmap</h3>
                    {isEditing && (
                      <Button variant="outline" size="sm" onClick={resetScoringAreas}>
                        Reset
                      </Button>
                    )}
                  </div>
                  <div 
                    className="grid grid-cols-3 gap-2 max-w-xs mx-auto"
                    role="grid"
                    aria-label="Scoring zones heatmap"
                  >
                    {scoringAreas.map((row, rowIndex) => 
                      row.map((value, colIndex) => {
                        const zoneIndex = rowIndex * 3 + colIndex;
                        const zoneLabels = ['Top Left', 'Top Center', 'Top Right', 'Middle Left', 'Middle Center', 'Middle Right', 'Bottom Left', 'Bottom Center', 'Bottom Right'];
                        
                        return (
                          <div 
                            key={`${rowIndex}-${colIndex}`} 
                            className="aspect-square relative"
                            role="gridcell"
                          >
                            <div 
                              className="absolute inset-0 bg-blue-100 rounded flex items-center justify-center cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              tabIndex={isEditing ? 0 : -1}
                              role={isEditing ? "button" : undefined}
                              aria-label={isEditing ? `${zoneLabels[zoneIndex]}: ${value} shots. Press Enter or Space to increase count` : `${zoneLabels[zoneIndex]}: ${value} shots`}
                              onClick={() => isEditing && updateScoringArea(rowIndex, colIndex, 1)}
                              onKeyDown={(e) => {
                                if (!isEditing) return;
                                
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  updateScoringArea(rowIndex, colIndex, 1);
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  const prevRow = rowIndex > 0 ? rowIndex - 1 : 2;
                                  const prevElement = document.querySelector(`[data-zone="${prevRow}-${colIndex}"]`) as HTMLElement;
                                  prevElement?.focus();
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  const nextRow = rowIndex < 2 ? rowIndex + 1 : 0;
                                  const nextElement = document.querySelector(`[data-zone="${nextRow}-${colIndex}"]`) as HTMLElement;
                                  nextElement?.focus();
                                } else if (e.key === 'ArrowLeft') {
                                  e.preventDefault();
                                  const prevCol = colIndex > 0 ? colIndex - 1 : 2;
                                  const prevElement = document.querySelector(`[data-zone="${rowIndex}-${prevCol}"]`) as HTMLElement;
                                  prevElement?.focus();
                                } else if (e.key === 'ArrowRight') {
                                  e.preventDefault();
                                  const nextCol = colIndex < 2 ? colIndex + 1 : 0;
                                  const nextElement = document.querySelector(`[data-zone="${rowIndex}-${nextCol}"]`) as HTMLElement;
                                  nextElement?.focus();
                                } else if (e.key === '-' || e.key === '_') {
                                  e.preventDefault();
                                  updateScoringArea(rowIndex, colIndex, -1);
                                }
                              }}
                              data-zone={`${rowIndex}-${colIndex}`}
                            >
                              <span className="text-xs font-medium text-blue-800">{value}</span>
                            </div>
                            {isEditing && (
                              <div className="absolute inset-0 flex flex-col justify-between items-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-4 w-4 text-white hover:bg-white hover:bg-opacity-20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateScoringArea(rowIndex, colIndex, 1);
                                  }}
                                  aria-label={`Increase ${zoneLabels[zoneIndex]} count`}
                                >
                                  <Plus size={12} />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-4 w-4 text-white hover:bg-white hover:bg-opacity-20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateScoringArea(rowIndex, colIndex, -1);
                                  }}
                                  aria-label={`Decrease ${zoneLabels[zoneIndex]} count`}
                                >
                                  <Minus size={12} />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Click on zones to track scoring attempts during matches
                  </p>
                  {isEditing && (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      Click or press Space/Enter to increase count, - to decrease count
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-8">
                <h3 className="font-medium mb-4">Recent Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="game" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="goals" fill="#3b82f6" name="Goals" />
                      <Bar dataKey="assists" fill="#10b981" name="Assists" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;