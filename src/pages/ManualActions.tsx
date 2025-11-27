import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Minus, Download, Save, Edit3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
// Add jsPDF import
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { dataManagementService, Player as DataPlayer } from '../services/dataManagementService';

// Add a separate interface for shot map data
interface PlayerShotMapData {
  [playerId: string]: { [key: string]: number };
}

// Add interface for player notes
interface PlayerNotes {
  [playerId: string]: string;
}

// Add interface for player statistics
interface PlayerStats {
  [playerId: string]: {
    goal: number;
    goalAgainst: number;
    cornerFor: number;
    cornerAgainst: number;
    penaltyFor: number;
    penaltyAgainst: number;
    duelWon: number;
    duelLost: number;
    shotOnTarget: number;
    shotOffTarget: number;
    ballRecovered: number;
    ballLost: number;
    foulFor: number;
    foulAgainst: number;
    quickActions: number;
  };
}

// Define our Player interface with all needed properties
interface Player {
  id: string; // Use string to match DataPlayer
  name: string;
  number: number;
  position: string;
}

const ManualActions = () => {
  const { t } = useLanguage();
  
  // State for players
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // State for player statistics
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    const initialStats: PlayerStats = {};
    return initialStats;
  });

  // State for player notes
  const [playerNotes, setPlayerNotes] = useState<PlayerNotes>(() => {
    const savedNotes = localStorage.getItem('manual_actions_player_notes');
    return savedNotes ? JSON.parse(savedNotes) : {};
  });

  // State for goal scoring map visibility
  const [showGoalMap, setShowGoalMap] = useState<number | null>(null);
  // State for goal map data
  const [goalMapData, setGoalMapData] = useState<PlayerShotMapData>(() => {
    // Load from localStorage
    const savedData = localStorage.getItem('manual_actions_shot_maps');
    return savedData ? JSON.parse(savedData) : {};
  });

  // State for notes editing
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  // Load players from data management service
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const playersData = await dataManagementService.getPlayers();
        // Transform the data to match our Player interface
        const transformedPlayers: Player[] = [];
        
        for (const player of playersData) {
          // Only include players with valid IDs
          if (player.id && typeof player.id === 'string') {
            transformedPlayers.push({
              id: player.id,
              name: player.name,
              number: player.jersey_number || 0,
              position: player.position
            });
          }
        }
        
        setPlayers(transformedPlayers);
        
        // Initialize player stats
        const initialStats: PlayerStats = {};
        transformedPlayers.forEach(player => {
          initialStats[player.id] = {
            goal: 0,
            goalAgainst: 0,
            cornerFor: 0,
            cornerAgainst: 0,
            penaltyFor: 0,
            penaltyAgainst: 0,
            duelWon: 0,
            duelLost: 0,
            shotOnTarget: 0,
            shotOffTarget: 0,
            ballRecovered: 0,
            ballLost: 0,
            foulFor: 0,
            foulAgainst: 0,
            quickActions: 0
          };
        });
        setPlayerStats(initialStats);
      } catch (error) {
        console.error('Error loading players:', error);
        toast.error('Failed to load players');
        
        // Fallback to mock data
        const mockPlayers: Player[] = [
          { id: '1', name: 'Carlos Rodríguez', number: 7, position: t('position.forward') },
          { id: '2', name: 'Miguel Ángel Torres', number: 10, position: t('position.midfielder') },
          { id: '3', name: 'David López', number: 4, position: t('position.defender') },
          { id: '4', name: 'Juan Martínez', number: 9, position: t('position.forward') },
          { id: '5', name: 'Roberto García', number: 6, position: t('position.midfielder') },
          { id: '6', name: 'Luis Sánchez', number: 3, position: t('position.defender') },
          { id: '7', name: 'Antonio Pérez', number: 2, position: t('position.defender') },
          { id: '8', name: 'Fernando Ruiz', number: 11, position: t('position.forward') },
          { id: '9', name: 'Pablo Díaz', number: 8, position: t('position.midfielder') },
          { id: '10', name: 'Javier Moreno', number: 1, position: t('position.goalkeeper') },
        ];
        setPlayers(mockPlayers);
        
        // Initialize player stats for mock data
        const initialStats: PlayerStats = {};
        mockPlayers.forEach(player => {
          initialStats[player.id] = {
            goal: 0,
            goalAgainst: 0,
            cornerFor: 0,
            cornerAgainst: 0,
            penaltyFor: 0,
            penaltyAgainst: 0,
            duelWon: 0,
            duelLost: 0,
            shotOnTarget: 0,
            shotOffTarget: 0,
            ballRecovered: 0,
            ballLost: 0,
            foulFor: 0,
            foulAgainst: 0,
            quickActions: 0
          };
        });
        setPlayerStats(initialStats);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, [t]);

  const updateStat = (playerId: string, stat: keyof PlayerStats[string], increment: boolean) => {
    setPlayerStats((prev: PlayerStats) => {
      const playerStatsCopy = { ...prev };
      if (!playerStatsCopy[playerId]) {
        playerStatsCopy[playerId] = {
          goal: 0,
          goalAgainst: 0,
          cornerFor: 0,
          cornerAgainst: 0,
          penaltyFor: 0,
          penaltyAgainst: 0,
          duelWon: 0,
          duelLost: 0,
          shotOnTarget: 0,
          shotOffTarget: 0,
          ballRecovered: 0,
          ballLost: 0,
          foulFor: 0,
          foulAgainst: 0,
          quickActions: 0
        };
      }
      
      const currentValue = playerStatsCopy[playerId][stat] || 0;
      playerStatsCopy[playerId] = {
        ...playerStatsCopy[playerId],
        [stat]: Math.max(0, currentValue + (increment ? 1 : -1))
      };
      
      return playerStatsCopy;
    });
  };

  // Save data to localStorage
  const saveData = () => {
    try {
      localStorage.setItem('statsor_manual_actions', JSON.stringify(playerStats));
      localStorage.setItem('manual_actions_player_notes', JSON.stringify(playerNotes));
      toast.success(t('manual.actions.save') + ' ' + t('general.success'));
    } catch (error) {
      toast.error(t('general.error') + ': ' + t('manual.actions.save').toLowerCase());
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Headers
      csvContent += [
        t('manual.actions.player'),
        'Goal',
        'Goal Against',
        'Corner For',
        'Corner Against',
        'Penalty For',
        'Penalty Against',
        'Duel Won',
        'Duel Lost',
        'Shot on Target',
        'Shot off Target',
        'Ball Recovered',
        'Ball Lost',
        'Foul For',
        'Foul Against',
        'Quick Actions',
        'Notes'
      ].join(",") + "\n";
      
      // Data rows
      players.forEach(player => {
        const stats = playerStats[player.id] || {
          goal: 0,
          goalAgainst: 0,
          cornerFor: 0,
          cornerAgainst: 0,
          penaltyFor: 0,
          penaltyAgainst: 0,
          duelWon: 0,
          duelLost: 0,
          shotOnTarget: 0,
          shotOffTarget: 0,
          ballRecovered: 0,
          ballLost: 0,
          foulFor: 0,
          foulAgainst: 0,
          quickActions: 0
        };
        const notes = playerNotes[player.id] || '';
        csvContent += [
          `"${player.name}"`,
          stats.goal || 0,
          stats.goalAgainst || 0,
          stats.cornerFor || 0,
          stats.cornerAgainst || 0,
          stats.penaltyFor || 0,
          stats.penaltyAgainst || 0,
          stats.duelWon || 0,
          stats.duelLost || 0,
          stats.shotOnTarget || 0,
          stats.shotOffTarget || 0,
          stats.ballRecovered || 0,
          stats.ballLost || 0,
          stats.foulFor || 0,
          stats.foulAgainst || 0,
          stats.quickActions || 0,
          `"${notes}"`
        ].join(",") + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "manual_actions_stats.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('manual.actions.export') + ' CSV ' + t('general.success'));
    } catch (error) {
      toast.error(t('general.error') + ': ' + t('manual.actions.export').toLowerCase() + ' CSV');
    }
  };

  // Export to JSON
  const exportToJSON = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        players: players.map(player => {
          const stats = playerStats[player.id] || {
            goal: 0,
            goalAgainst: 0,
            cornerFor: 0,
            cornerAgainst: 0,
            penaltyFor: 0,
            penaltyAgainst: 0,
            duelWon: 0,
            duelLost: 0,
            shotOnTarget: 0,
            shotOffTarget: 0,
            ballRecovered: 0,
            ballLost: 0,
            foulFor: 0,
            foulAgainst: 0,
            quickActions: 0
          };
          const notes = playerNotes[player.id] || '';
          return {
            id: player.id,
            name: player.name,
            number: player.number,
            position: player.position,
            stats: stats,
            notes: notes
          };
        })
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'manual_actions_stats.json';
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(t('manual.actions.export') + ' JSON ' + t('general.success'));
    } catch (error) {
      toast.error(t('general.error') + ': ' + t('manual.actions.export').toLowerCase() + ' JSON');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      // Create a new jsPDF instance
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(t('manual.actions.title'), 14, 20);
      
      // Add export date
      doc.setFontSize(12);
      doc.text(`${t('general.exportedAt')}: ${new Date().toLocaleString()}`, 14, 30);
      
      // Prepare table data
      const headers = [
        t('manual.actions.player'),
        'Goal',
        'Goal Against',
        'Corner For',
        'Corner Against',
        'Penalty For',
        'Penalty Against',
        'Duel Won',
        'Duel Lost',
        'Shot on Target',
        'Shot off Target',
        'Ball Recovered',
        'Ball Lost',
        'Foul For',
        'Foul Against',
        'Quick Actions',
        'Notes'
      ];
      
      const data = players.map(player => {
        const stats = playerStats[player.id] || {
          goal: 0,
          goalAgainst: 0,
          cornerFor: 0,
          cornerAgainst: 0,
          penaltyFor: 0,
          penaltyAgainst: 0,
          duelWon: 0,
          duelLost: 0,
          shotOnTarget: 0,
          shotOffTarget: 0,
          ballRecovered: 0,
          ballLost: 0,
          foulFor: 0,
          foulAgainst: 0,
          quickActions: 0
        };
        const notes = playerNotes[player.id] || '';
        
        return [
          `${player.name} (#${player.number})`,
          stats.goal.toString(),
          stats.goalAgainst.toString(),
          stats.cornerFor.toString(),
          stats.cornerAgainst.toString(),
          stats.penaltyFor.toString(),
          stats.penaltyAgainst.toString(),
          stats.duelWon.toString(),
          stats.duelLost.toString(),
          stats.shotOnTarget.toString(),
          stats.shotOffTarget.toString(),
          stats.ballRecovered.toString(),
          stats.ballLost.toString(),
          stats.foulFor.toString(),
          stats.foulAgainst.toString(),
          stats.quickActions.toString(),
          notes
        ];
      });
      
      // Add table
      (doc as any).autoTable({
        head: [headers],
        body: data,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Player name
          16: { cellWidth: 25 } // Notes
        }
      });
      
      // Save the PDF
      doc.save('manual_actions_stats.pdf');
      
      toast.success(t('manual.actions.export') + ' PDF ' + t('general.success'));
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(t('general.error') + ': ' + t('manual.actions.export').toLowerCase() + ' PDF');
    }
  };

  // Handle goal increment with goal map
  const handleGoalIncrement = (playerId: number) => {
    // First increment the goal count
    updateStat(playerId, 'goal', true);
    
    // Show the goal map for this player
    setShowGoalMap(playerId);
  };

  // Handle shot map click
  const handleShotMapClick = (playerId: number, zone: string) => {
    setGoalMapData(prev => {
      const newData = { ...prev };
      if (!newData[playerId]) {
        newData[playerId] = {};
      }
      newData[playerId][zone] = (newData[playerId][zone] || 0) + 1;
      
      // Save to localStorage
      localStorage.setItem('manual_actions_shot_maps', JSON.stringify(newData));
      
      return newData;
    });
    
    toast.success(t('manual.actions.shot.map.updated'));
  };

  // Render shot map
  const renderShotMap = (playerId: string) => {
    if (showGoalMap !== playerId) {
      return null;
    }
    
    // Find player name safely
    const player = players.find(p => p.id === playerId);
    const playerName = player ? player.name : `Player ${playerId}`;
    
    // Define goal zones with more descriptive names
    const zones = [
      { id: 'top-left', label: 'Top Left' },
      { id: 'top-center', label: 'Top Center' },
      { id: 'top-right', label: 'Top Right' },
      { id: 'middle-left', label: 'Middle Left' },
      { id: 'middle-center', label: 'Center' },
      { id: 'middle-right', label: 'Middle Right' },
      { id: 'bottom-left', label: 'Bottom Left' },
      { id: 'bottom-center', label: 'Bottom Center' },
      { id: 'bottom-right', label: 'Bottom Right' }
    ];
    
    // Soccer goal visualization dimensions
    const goalWidth = 240;
    const goalHeight = 140;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full border border-gray-200">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {t('manual.actions.shot.map')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{playerName}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowGoalMap(null)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="mb-5 bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-sm text-blue-800 font-medium">
              {t('manual.actions.shot.map.select.zone')}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {t('manual.actions.shot.map.click.to.add')}
            </p>
          </div>
          
          {/* Soccer Goal Visualization Container */}
          <div className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-200">
            <div className="flex justify-center">
              {/* Soccer Goal Visualization */}
              <div className="relative" style={{ width: goalWidth, height: goalHeight }}>
                {/* Goal Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-500 to-green-600 rounded-lg border-4 border-white shadow-lg"></div>
                
                {/* Goal Net Lines */}
                {/* Vertical lines */}
                <div className="absolute top-0 left-1/3 h-full w-0.5 bg-white opacity-40"></div>
                <div className="absolute top-0 left-2/3 h-full w-0.5 bg-white opacity-40"></div>
                
                {/* Horizontal lines */}
                <div className="absolute left-0 top-1/3 w-full h-0.5 bg-white opacity-40"></div>
                <div className="absolute left-0 top-2/3 w-full h-0.5 bg-white opacity-40"></div>
                
                {/* Zone Buttons */}
                {zones.map((zone, index) => {
                  // Calculate position based on index
                  const row = Math.floor(index / 3);
                  const col = index % 3;
                  
                  // Position each zone button
                  const top = (row * (goalHeight / 3)) + (goalHeight / 6) - 15;
                  const left = (col * (goalWidth / 3)) + (goalWidth / 6) - 15;
                  
                  return (
                    <button
                      key={zone.id}
                      className="absolute w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md transform hover:scale-110 transition-all duration-200 border-2 border-white"
                      style={{ top: `${top}px`, left: `${left}px` }}
                      onClick={() => handleShotMapClick(playerId, zone.id)}
                    >
                      {(goalMapData[playerId] && goalMapData[playerId][zone.id] || 0) > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                          {goalMapData[playerId]?.[zone.id] || 0}
                        </span>
                      )}
                    </button>
                  );
                })}
                
                {/* Goal Posts */}
                <div className="absolute top-0 left-0 w-3 h-full bg-gray-300 rounded-l-lg"></div>
                <div className="absolute top-0 right-0 w-3 h-full bg-gray-300 rounded-r-lg"></div>
                <div className="absolute top-0 left-0 w-full h-3 bg-gray-300 rounded-t-lg"></div>
              </div>
            </div>
          </div>
          
          {/* Zone Labels Grid */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">{t('manual.actions.shot.map.zones')}</h4>
            <div className="grid grid-cols-3 gap-2">
              {zones.map(zone => (
                <div 
                  key={zone.id} 
                  className="flex items-center p-2 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-xs font-medium text-gray-700 truncate">{zone.label}</span>
                  {(goalMapData[playerId] && goalMapData[playerId][zone.id] || 0) > 0 && (
                    <span className="ml-auto bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {goalMapData[playerId]?.[zone.id] || 0}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Close Button */}
          <div className="mt-5">
            <Button 
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              onClick={() => setShowGoalMap(null)}
            >
              {t('general.close')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Start editing note
  const startEditingNote = (playerId: number) => {
    setEditingNote(playerId);
    setNoteText(playerNotes[playerId] || '');
  };

  // Save note
  const saveNote = (playerId: number) => {
    setPlayerNotes(prev => {
      const newNotes = { ...prev };
      newNotes[playerId] = noteText;
      
      // Save to localStorage
      localStorage.setItem('manual_actions_player_notes', JSON.stringify(newNotes));
      
      return newNotes;
    });
    
    setEditingNote(null);
    setNoteText('');
    toast.success(t('manual.actions.note.saved'));
  };

  // Cancel editing note
  const cancelEditingNote = () => {
    setEditingNote(null);
    setNoteText('');
  };

  // Render note editor or display
  const renderNote = (playerId: number) => {
    if (editingNote === playerId) {
      return (
        <div className="mt-2 flex flex-col space-y-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            rows={3}
            placeholder={t('manual.actions.add.note')}
          />
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => saveNote(playerId)}>
              {t('general.save')}
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEditingNote}>
              {t('general.cancel')}
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mt-2">
        {playerNotes[playerId] ? (
          <div className="text-sm bg-gray-50 p-2 rounded">
            <p>{playerNotes[playerId]}</p>
            <Button 
              size="sm" 
              variant="ghost" 
              className="mt-1 p-1 h-auto"
              onClick={() => startEditingNote(playerId)}
            >
              <Edit3 className="h-3 w-3 mr-1" />
              {t('general.edit')}
            </Button>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs"
            onClick={() => startEditingNote(playerId)}
          >
            <Edit3 className="h-3 w-3 mr-1" />
            {t('manual.actions.add.note')}
          </Button>
        )}
      </div>
    );
  };

  const StatCounter = ({ 
    value, 
    onIncrement, 
    onDecrement,
    showGoalMap = false
  }: { 
    value: number, 
    onIncrement: () => void, 
    onDecrement: () => void,
    showGoalMap?: boolean
  }) => (
    <div className="flex items-center justify-center space-x-1">
      <Button
        size="sm"
        variant="outline"
        className="h-6 w-6 p-0 hover:bg-red-50 hover:border-red-300"
        onClick={onDecrement}
      >
        <Minus className="h-3 w-3 text-red-600" />
      </Button>
      <span className="w-8 text-center text-sm font-medium">{value}</span>
      <Button
        size="sm"
        variant="outline"
        className="h-6 w-6 p-0 hover:bg-green-50 hover:border-green-300"
        onClick={showGoalMap ? onIncrement : onIncrement}
      >
        <Plus className="h-3 w-3 text-green-600" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{t('manual.actions.title')}</h1>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={saveData}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {t('manual.actions.save')}
            </Button>
            <div className="relative">
              <Button 
                variant="outline"
                onClick={() => {
                  const menu = document.getElementById('export-menu');
                  if (menu) {
                    menu.classList.toggle('hidden');
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('manual.actions.export')}
              </Button>
              <div 
                id="export-menu" 
                className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border hidden"
              >
                <button
                  onClick={() => {
                    exportToCSV();
                    document.getElementById('export-menu')?.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('manual.actions.export.csv')}
                </button>
                <button
                  onClick={() => {
                    exportToJSON();
                    document.getElementById('export-menu')?.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('manual.actions.export.json')}
                </button>
                <button
                  onClick={() => {
                    exportToPDF();
                    document.getElementById('export-menu')?.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('manual.actions.export.pdf')}
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 self-center">{t('manual.actions.realtime')}</div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading players...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">{t('manual.actions.title')}</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={saveData}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {t('manual.actions.save')}
          </Button>
          <div className="relative">
            <Button 
              variant="outline"
              onClick={() => {
                const menu = document.getElementById('export-menu');
                if (menu) {
                  menu.classList.toggle('hidden');
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('manual.actions.export')}
            </Button>
            <div 
              id="export-menu" 
              className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border hidden"
            >
              <button
                onClick={() => {
                  exportToCSV();
                  document.getElementById('export-menu')?.classList.add('hidden');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {t('manual.actions.export.csv')}
              </button>
              <button
                onClick={() => {
                  exportToJSON();
                  document.getElementById('export-menu')?.classList.add('hidden');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {t('manual.actions.export.json')}
              </button>
              <button
                onClick={() => {
                  exportToPDF();
                  document.getElementById('export-menu')?.classList.add('hidden');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {t('manual.actions.export.pdf')}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500 self-center">{t('manual.actions.realtime')}</div>
        </div>
      </div>

      {/* Tabla de Registro de Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>{t('manual.actions.subtitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">{t('manual.actions.player')}</th>
                  <th className="text-center p-3 font-medium">Goal</th>
                  <th className="text-center p-3 font-medium">Goal Against</th>
                  <th className="text-center p-3 font-medium">Corner For</th>
                  <th className="text-center p-3 font-medium">Corner Against</th>
                  <th className="text-center p-3 font-medium">Penalty For</th>
                  <th className="text-center p-3 font-medium">Penalty Against</th>
                  <th className="text-center p-3 font-medium">Duel Won</th>
                  <th className="text-center p-3 font-medium">Duel Lost</th>
                  <th className="text-center p-3 font-medium">Shot on Target</th>
                  <th className="text-center p-3 font-medium">Shot off Target</th>
                  <th className="text-center p-3 font-medium">Ball Recovered</th>
                  <th className="text-center p-3 font-medium">Ball Lost</th>
                  <th className="text-center p-3 font-medium">Foul For</th>
                  <th className="text-center p-3 font-medium">Foul Against</th>
                  <th className="text-center p-3 font-medium">Quick Actions</th>
                  <th className="text-center p-3 font-medium">{t('manual.actions.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm">
                          {player.number}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{player.name}</p>
                          <p className="text-xs text-gray-500">{player.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.goal || 0}
                        onIncrement={() => handleGoalIncrement(player.id)}
                        onDecrement={() => updateStat(player.id, 'goal', false)}
                        showGoalMap={true}
                      />
                      {renderShotMap(player.id)}
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.goalAgainst || 0}
                        onIncrement={() => updateStat(player.id, 'goalAgainst', true)}
                        onDecrement={() => updateStat(player.id, 'goalAgainst', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.cornerFor || 0}
                        onIncrement={() => updateStat(player.id, 'cornerFor', true)}
                        onDecrement={() => updateStat(player.id, 'cornerFor', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.cornerAgainst || 0}
                        onIncrement={() => updateStat(player.id, 'cornerAgainst', true)}
                        onDecrement={() => updateStat(player.id, 'cornerAgainst', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.penaltyFor || 0}
                        onIncrement={() => updateStat(player.id, 'penaltyFor', true)}
                        onDecrement={() => updateStat(player.id, 'penaltyFor', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.penaltyAgainst || 0}
                        onIncrement={() => updateStat(player.id, 'penaltyAgainst', true)}
                        onDecrement={() => updateStat(player.id, 'penaltyAgainst', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.duelWon || 0}
                        onIncrement={() => updateStat(player.id, 'duelWon', true)}
                        onDecrement={() => updateStat(player.id, 'duelWon', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.duelLost || 0}
                        onIncrement={() => updateStat(player.id, 'duelLost', true)}
                        onDecrement={() => updateStat(player.id, 'duelLost', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.shotOnTarget || 0}
                        onIncrement={() => updateStat(player.id, 'shotOnTarget', true)}
                        onDecrement={() => updateStat(player.id, 'shotOnTarget', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.shotOffTarget || 0}
                        onIncrement={() => updateStat(player.id, 'shotOffTarget', true)}
                        onDecrement={() => updateStat(player.id, 'shotOffTarget', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.ballRecovered || 0}
                        onIncrement={() => updateStat(player.id, 'ballRecovered', true)}
                        onDecrement={() => updateStat(player.id, 'ballRecovered', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.ballLost || 0}
                        onIncrement={() => updateStat(player.id, 'ballLost', true)}
                        onDecrement={() => updateStat(player.id, 'ballLost', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.foulFor || 0}
                        onIncrement={() => updateStat(player.id, 'foulFor', true)}
                        onDecrement={() => updateStat(player.id, 'foulFor', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.foulAgainst || 0}
                        onIncrement={() => updateStat(player.id, 'foulAgainst', true)}
                        onDecrement={() => updateStat(player.id, 'foulAgainst', false)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <StatCounter
                        value={playerStats[player.id]?.quickActions || 0}
                        onIncrement={() => updateStat(player.id, 'quickActions', true)}
                        onDecrement={() => updateStat(player.id, 'quickActions', false)}
                      />
                    </td>
                    <td className="p-3">
                      {renderNote(player.id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualActions;