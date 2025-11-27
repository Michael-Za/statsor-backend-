import React, { useEffect, useState } from 'react';
import { demoAccountService } from '../services/demoAccountService';

const TestDemoPlayers: React.FC = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemoPlayers = () => {
      try {
        const demoPlayers = demoAccountService.getDemoPlayers();
        setPlayers(demoPlayers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching demo players:', error);
        setLoading(false);
      }
    };

    fetchDemoPlayers();
  }, []);

  if (loading) {
    return <div className="p-4">Loading demo players...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Demo Players Test</h2>
      <p className="mb-4">Total Players: {players.length}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <div key={player.id} className="border p-4 rounded-lg bg-white shadow">
            <h3 className="font-bold text-lg">{player.name}</h3>
            <p>Position: {player.position}</p>
            <p>Age: {player.age}</p>
            <p>Nationality: {player.nationality}</p>
            <p>Jersey Number: {player.jersey_number}</p>
            <p>Goals: {player.goals}</p>
            <p>Assists: {player.assists}</p>
            <p>Rating: {player.rating}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestDemoPlayers;