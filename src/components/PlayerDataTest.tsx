import React, { useEffect, useState } from 'react';
import { dataManagementService, Player } from '../services/dataManagementService';
import { demoAccountService } from '../services/demoAccountService';

const PlayerDataTest: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we're in demo mode
        const demoMode = localStorage.getItem('user_type') === 'demo';
        console.log('[PlayerDataTest] Demo mode:', demoMode);
        setIsDemo(demoMode);
        
        let playerData: Player[] = [];
        
        if (demoMode) {
          // Get players from demo service
          console.log('[PlayerDataTest] Fetching demo players...');
          playerData = demoAccountService.getDemoPlayers();
          console.log('[PlayerDataTest] Demo players count:', playerData.length);
        } else {
          // Get players from real database
          console.log('[PlayerDataTest] Fetching real players...');
          playerData = await dataManagementService.getPlayers();
          console.log('[PlayerDataTest] Real players count:', playerData.length);
        }
        
        setPlayers(playerData);
      } catch (err) {
        console.error('[PlayerDataTest] Error fetching players:', err);
        setError('Failed to fetch players: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return <div className="p-4">Loading players...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Player Data Test</h2>
      <p className="mb-2">Mode: {isDemo ? 'Demo' : 'Real Account'}</p>
      <p className="mb-4">Total Players: {players.length}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <div key={player.id} className="border p-4 rounded-lg">
            <h3 className="font-bold text-lg">{player.name}</h3>
            <p>Position: {player.position}</p>
            <p>Age: {player.age}</p>
            <p>Nationality: {player.nationality}</p>
            <p>Jersey Number: {player.jersey_number}</p>
            <p>Goals: {player.goals}</p>
            <p>Assists: {player.assists}</p>
            <p>Rating: {player['rating']}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerDataTest;