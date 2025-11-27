import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { ArrowLeft, Camera, X, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AddPlayerForm from '../components/AddPlayerForm';
import { PlayerPhotoUpload } from '../components/PlayerPhotoUpload';
import { playerManagementService } from '../services/playerManagementService';
import { toast } from 'sonner';

// Define our Player interface with all needed properties
interface Player {
  id?: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  number: number;
  
  // Extended properties
  nickname: string;
  secondaryPositions: string[];
  dominantFoot: string;
  birthDate: Date;
  goals: number;
  assists: number;
  minutes: number;
  games: number;
  yellowCards: number;
  redCards: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  foulsCommitted: number;
  foulsReceived: number;
  ballsLost: number;
  ballsRecovered: number;
  duelsWon: number;
  duelsLost: number;
  crosses: number;
  saves: number;
  photo: string;
  shotMap: { [key: string]: number };
}

const Players = () => {
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAddPlayerFormOpen, setIsAddPlayerFormOpen] = useState(false);
  const [modalCard, setModalCard] = useState<'player' | 'performance' | 'stats' | 'shotMap' | null>(null);
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'home' | 'away'>('all');
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [photoUploadPlayer, setPhotoUploadPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [, setLoading] = useState(true);

  // Refresh player data when component mounts or when navigating back
  useEffect(() => {
    loadPlayers();
    
    // Subscribe to player updates from the centralized service
    const unsubscribe = playerManagementService.onPlayersUpdated(() => {
      console.log('[Players] Players updated, reloading...');
      loadPlayers();
    });
    
    // Add event listener for when user navigates back to this page
    const handleBeforeUnload = () => {
      loadPlayers();
    };
    
    // Listen for focus event (when user comes back to this tab)
    window.addEventListener('focus', handleBeforeUnload);
    
    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleBeforeUnload);
    };
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      console.log('[Players] Loading players from playerManagementService');
      
      // Use the centralized player management service
      const playersData = await playerManagementService.getPlayers();
      console.log('[Players] Loaded players:', playersData.length);
      
      // Transform the data to match our Player interface
      const transformedPlayers: Player[] = playersData.map(player => ({
        id: player.id || '',
        name: player.name || 'Unknown',
        position: player.position || 'MID',
        age: player.age || 25,
        nationality: player.nationality || 'Unknown',
        number: player.jersey_number || Math.floor(Math.random() * 99) + 1,
        nickname: player.nickname || '',
        secondaryPositions: player.secondary_positions || [],
        dominantFoot: player.preferred_foot || 'Right',
        birthDate: player.date_of_birth ? new Date(player.date_of_birth) : new Date('1990-01-01'),
        goals: player.goals || 0,
        assists: player.assists || 0,
        games: player.games || 0,
        yellowCards: player.yellow_cards || 0,
        redCards: player.red_cards || 0,
        minutes: player.minutes || 0,
        shots: player.shots || 0,
        shotsOnTarget: player.shots_on_target || 0,
        passes: player.passes || 0,
        passAccuracy: player.pass_accuracy || 0,
        foulsCommitted: player.fouls_committed || 0,
        foulsReceived: player.fouls_received || 0,
        ballsLost: player.balls_lost || 0,
        ballsRecovered: player.balls_recovered || 0,
        duelsWon: player.duels_won || 0,
        duelsLost: player.duels_lost || 0,
        crosses: player.crosses || 0,
        saves: player.saves || 0,
        photo: player.photo_url || '/placeholder.svg',
        shotMap: player.shot_map || { 
          'top-left': 0, 'top-center': 0, 'top-right': 0, 
          'middle-left': 0, 'middle-center': 0, 'middle-right': 0, 
          'bottom-left': 0, 'bottom-center': 0, 'bottom-right': 0 
        }
      }));
      setPlayers(transformedPlayers);
    } catch (error) {
      console.error('[Players] Error loading players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (newPlayerData: Partial<Player>) => {
    try {
      console.log('[Players] Adding new player:', newPlayerData);
      
      // Use the centralized player management service
      const result = await playerManagementService.createPlayer(newPlayerData as any);
      
      if (result.success && result.data) {
        console.log('[Players] Player created successfully:', result.data);
        setIsAddPlayerFormOpen(false);
        
        // Reload players to ensure sync across all sections
        await loadPlayers();
      } else {
        console.error('[Players] Failed to create player:', result.errors);
        const errorMsg = result.errors?.map(e => e.message).join(', ') || 'Unknown error';
        toast.error(`Failed to add player: ${errorMsg}`);
      }
    } catch (error) {
      console.error('[Players] Error adding player:', error);
      toast.error(`Failed to add player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePhotoSave = async (playerId: string, photoUrl: string) => {
    try {
      // Note: The backend API doesn't support photo updates directly, so we'll just update locally
      setPlayers(prev => prev.map(player => 
        player.id === playerId ? { ...player, photo: photoUrl } : player
      ));
      setPhotoUploadPlayer(null);
      toast.success('Photo updated successfully!');
    } catch (error) {
      console.error('Error updating player photo:', error);
      toast.error('Failed to update photo');
    }
  };
  
  const renderPlayerDetail = () => {
    if (!selectedPlayer) return null;

    // Datos de performance simulados por partido (últimos partidos)
    const allPerformanceData = [
      { match: 'vs Real', date: '12 Dic', score: 5.5, rival: 'Real Madrid', location: 'away' },
      { match: 'vs Arsenal', date: '17 Dic', score: 8.5, rival: 'Arsenal', location: 'home' },
      { match: 'vs Wolves', date: '25 Dic', score: 9.5, rival: 'Wolverhampton', location: 'away' },
      { match: 'vs West Ham', date: '29 Dic', score: 6.8, rival: 'West Ham', location: 'home' },
      { match: 'vs Aston Villa', date: '4 Ene', score: 7.8, rival: 'Aston Villa', location: 'away' },
      { match: 'vs Brighton', date: '8 Ene', score: 8.5, rival: 'Brighton', location: 'home' },
      { match: 'vs Fulham', date: '15 Ene', score: 6.5, rival: 'Fulham', location: 'away' },
      { match: 'vs Man City', date: '29 Ene', score: 5.5, rival: 'Manchester City', location: 'home' },
      { match: 'vs Everton', date: '6 Feb', score: 6.5, rival: 'Everton', location: 'away' },
      { match: 'vs Sheffield', date: '17 Feb', score: 9.5, rival: 'Sheffield United', location: 'home' },
      { match: 'vs Chelsea', date: '24 Feb', score: 6.8, rival: 'Chelsea', location: 'away' }
    ];

    const performanceData = performanceFilter === 'all' 
      ? allPerformanceData 
      : allPerformanceData.filter(match => match.location === performanceFilter);

    return (
      <div className="w-screen h-screen overflow-hidden bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <Button
            onClick={() => setSelectedPlayer(null)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-xl font-bold">Player Details</h1>
          <div></div>
        </div>

        {/* Main Content - Full screen without extra padding */}
        <div className="h-[calc(100vh-70px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
            {/* Player Card */}
            <div className="lg:col-span-1 h-full bg-white border-r">
              <Card className="h-full rounded-none border-0 p-6">
                <div className="text-center">
                  <div className="relative mx-auto mb-4">
                    {selectedPlayer.photo ? (
                      <img 
                        src={selectedPlayer.photo} 
                        alt={selectedPlayer.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 mx-auto"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-300 mx-auto">
                        {selectedPlayer['number']}
                      </div>
                    )}
                    <button 
                      className="absolute bottom-2 right-4 bg-blue-500 rounded-full p-2 hover:bg-blue-600 transition"
                      onClick={() => setPhotoUploadPlayer(selectedPlayer)}
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  
                  <h2 className="text-2xl font-bold">{selectedPlayer.name}</h2>
                  <p className="text-gray-600 mb-4">{selectedPlayer.position}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="text-lg font-bold text-blue-600">{selectedPlayer.age}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Games</p>
                      <p className="text-lg font-bold text-green-600">{selectedPlayer.games}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Goals</p>
                      <p className="text-lg font-bold text-purple-600">{selectedPlayer.goals}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Assists</p>
                      <p className="text-lg font-bold text-yellow-600">{selectedPlayer.assists}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Performance and Stats Section */}
            <div className="lg:col-span-2 h-full flex flex-col">
              {/* Performance Chart */}
              <div className="flex-1 bg-white border-b">
                <Card className="h-full rounded-none border-0 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Performance Rating</h3>
                    <div className="flex space-x-1">
                      <button 
                        className={`px-3 py-1 rounded text-xs ${
                          performanceFilter === 'all' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => setPerformanceFilter('all')}
                      >
                        All
                      </button>
                      <button 
                        className={`px-3 py-1 rounded text-xs ${
                          performanceFilter === 'home' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => setPerformanceFilter('home')}
                      >
                        Home
                      </button>
                      <button 
                        className={`px-3 py-1 rounded text-xs ${
                          performanceFilter === 'away' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => setPerformanceFilter('away')}
                      >
                        Away
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-[calc(100%-40px)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          domain={[0, 10]}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}/10`, 'Rating']}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return `${data.rival} - ${data.date}`;
                            }
                            return label;
                          }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Bar 
                          dataKey="score" 
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
              
              {/* Stats Sections */}
              <div className="h-1/3 bg-white grid grid-cols-2">
                {/* Shot Map */}
                <div className="border-r p-4">
                  <h3 className="text-md font-bold mb-2">Shot Map</h3>
                  <div className="flex justify-center h-[calc(100%-30px)] items-center">
                    <div className="grid grid-cols-3 gap-1 w-32 h-24">
                      {Object.entries(selectedPlayer.shotMap || {}).map(([zone, goals]) => (
                        <div
                          key={zone}
                          className="bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-sm font-bold"
                        >
                          {goals}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Key Stats */}
                <div className="p-4">
                  <h3 className="text-md font-bold mb-2">Key Stats</h3>
                  <div className="space-y-2 h-[calc(100%-30px)] flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Minutes</span>
                      <span className="font-bold">{selectedPlayer.minutes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Shots on Target</span>
                      <span className="font-bold text-green-600">{selectedPlayer.shotsOnTarget}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pass Accuracy</span>
                      <span className="font-bold">{selectedPlayer.passAccuracy}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overlay */}
        {showStatsOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Complete Statistics for {selectedPlayer.name}</h2>
                <button 
                  onClick={() => setShowStatsOverlay(false)}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold text-blue-600 mb-2">Offensive Stats</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span>Goals</span>
                        <span className="font-bold text-blue-600">{selectedPlayer.goals}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span>Assists</span>
                        <span className="font-bold text-blue-600">{selectedPlayer.assists}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded">
                        <span>Shots</span>
                        <span className="font-bold">{selectedPlayer.shots}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-green-600 mb-2">Defensive Stats</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Balls Recovered</span>
                        <span className="font-bold">{selectedPlayer.ballsRecovered}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Duels Won</span>
                        <span className="font-bold">{selectedPlayer.duelsWon}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>Fouls Committed</span>
                        <span className="font-bold">{selectedPlayer.foulsCommitted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals for expanded views */}
        <Dialog open={modalCard !== null} onOpenChange={() => setModalCard(null)}>
          <DialogContent className="max-w-6xl w-full h-full p-0">
            <button 
              onClick={() => setModalCard(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded bg-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            {modalCard === 'player' && (
              <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8 h-full">
                <div className="text-center space-y-6">
                  <div className="relative mx-auto w-64 h-64">
                    {selectedPlayer.photo ? (
                      <img 
                        src={selectedPlayer.photo} 
                        alt={selectedPlayer.name}
                        className="w-64 h-64 rounded-xl object-cover border-4 border-white/20"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white text-8xl font-bold border-4 border-white/20">
                        {selectedPlayer['number']}
                      </div>
                    )}
                  </div>
                  <h1 className="text-5xl font-bold">{selectedPlayer.name}</h1>
                  <div className="text-2xl text-white/80">{selectedPlayer.position}</div>
                  <div className="grid grid-cols-3 gap-8 mt-8 text-center">
                    <div>
                      <div className="text-3xl font-bold">{selectedPlayer.games}</div>
                      <div className="text-white/70">Games</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-400">{selectedPlayer.goals}</div>
                      <div className="text-white/70">Goals</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-400">{selectedPlayer.assists}</div>
                      <div className="text-white/70">Assists</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalCard === 'performance' && (
              <div className="p-8 h-full">
                <h2 className="text-3xl font-bold mb-8">Detailed Performance</h2>
                <div style={{ width: '100%', height: 'calc(100% - 100px)' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 14 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        domain={[0, 10]}
                        tick={{ fontSize: 14 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}/10`, 'Rating']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `${data.rival} - ${data.date}`;
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Bar 
                        dataKey="score" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {modalCard === 'stats' && (
              <div className="p-8 h-full">
                <h2 className="text-3xl font-bold mb-8">Complete Statistics</h2>
                <div className="grid grid-cols-2 gap-8 h-[calc(100%-100px)]">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-blue-600">Offensive Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between p-4 bg-gray-100 rounded-lg">
                        <span>Goals</span>
                        <span className="font-bold text-green-600">{selectedPlayer.goals}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-100 rounded-lg">
                        <span>Assists</span>
                        <span className="font-bold text-blue-600">{selectedPlayer.assists}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-100 rounded-lg">
                        <span>Shots</span>
                        <span className="font-bold">{selectedPlayer.shots}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-green-600">Defensive Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between p-4 bg-gray-100 rounded-lg">
                        <span>Duels Won</span>
                        <span className="font-bold">{selectedPlayer.duelsWon}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-100 rounded-lg">
                        <span>Balls Recovered</span>
                        <span className="font-bold">{selectedPlayer.ballsRecovered}</span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-100 rounded-lg">
                        <span>Pass Accuracy</span>
                        <span className="font-bold">{selectedPlayer.passAccuracy}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalCard === 'shotMap' && (
              <div className="p-8 h-full bg-blue-50">
                <h2 className="text-3xl font-bold mb-8">Detailed Shot Map</h2>
                <div className="flex justify-center h-[calc(100%-150px)] items-center">
                  <div className="grid grid-cols-3 gap-4 w-96 h-64">
                    {Object.entries(selectedPlayer.shotMap || {}).map(([zone, goals]) => (
                      <div
                        key={zone}
                        className="border-4 border-blue-400 bg-blue-200 rounded-lg flex flex-col items-center justify-center text-2xl font-bold"
                      >
                        <div className="text-4xl">{goals}</div>
                        <div className="text-sm capitalize">{zone.replace('-', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-center text-lg mt-8">
                  Goals distribution across goal areas
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Photo Upload Modal */}
        {photoUploadPlayer && photoUploadPlayer.id && (
          <PlayerPhotoUpload
            isOpen={true}
            onClose={() => setPhotoUploadPlayer(null)}
            onPhotoSave={(photoUrl) => handlePhotoSave(photoUploadPlayer.id!, photoUrl)}
            playerName={photoUploadPlayer.name}
            playerId={photoUploadPlayer.id}
            {...(photoUploadPlayer.photo ? { currentPhoto: photoUploadPlayer.photo } : {})}
          />
        )}
      </div>
    );
  };

  const renderPlayersList = () => (
    <div className="w-screen h-screen overflow-hidden bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Players</h1>
        <Button
          onClick={() => setIsAddPlayerFormOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Player</span>
        </Button>
      </div>

      {/* Players Grid - Full screen without extra padding */}
      <div className="h-[calc(100vh-70px)] overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((player) => (
            <Card 
              key={player.id} 
              className="p-4 bg-white rounded cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/players/${player.id}`)}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {player.photo ? (
                    <img 
                      src={player.photo} 
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {player['number']}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{player.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {player.position}
                    </span>
                    <span className="text-sm text-gray-600">{player.age} yrs</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-lg font-bold text-green-600">{player.goals}</div>
                  <div className="text-xs text-gray-600">Goals</div>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-lg font-bold text-blue-600">{player.assists}</div>
                  <div className="text-xs text-gray-600">Assists</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-lg font-bold">{player.games}</div>
                  <div className="text-xs text-gray-600">Games</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <AddPlayerForm
        isOpen={isAddPlayerFormOpen}
        onClose={() => setIsAddPlayerFormOpen(false)}
        onSave={handleAddPlayer}
      />
    </div>
  );

  return (
    // Full screen without any extra margins or padding
    <div className="w-screen h-screen overflow-hidden">
      {selectedPlayer ? renderPlayerDetail() : renderPlayersList()}
    </div>
  );
};

export default Players;