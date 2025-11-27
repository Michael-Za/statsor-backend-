import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  Table as TableIcon, 
  Plus, 
  Search, 
  Edit, 
  Save, 
  X, 
  User, 
  Download, 
  Upload, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  Award,
  Shield,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash,
  Play,
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { dataManagementService, Player as DataPlayer } from '../services/dataManagementService';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  role: string;
  notes: string;
  rating: number;
  status: 'available' | 'injured' | 'suspended';
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  createdAt: Date;
}

// Add this new interface for player actions
interface PlayerAction {
  id: string;
  playerId: string;
  playerName: string;
  actionType: 'goal' | 'assist' | 'yellowCard' | 'redCard' | 'foul' | 'save' | 'substitution' | 'corner' | 'offside' | 'penalty';
  matchId: string;
  matchName: string;
  timestamp: string;
  minute: number;
  second: number; // Add seconds for more precise timing
  position?: {
    x: number; // Field position X coordinate (0-100)
    y: number; // Field position Y coordinate (0-100)
    area: string; // e.g, "Penalty Area", "Midfield", "Right Wing"
  };
  details: string; // Additional details about the action
  created_at: string;
}

interface Formation {
  id: string;
  name: string;
  description: string;
  players: string[]; // Player IDs
}

const CommandTable: React.FC = () => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>(() => {
    const savedPlayers = localStorage.getItem('statsor_command_players');
    if (savedPlayers) {
      try {
        const parsed = JSON.parse(savedPlayers);
        return parsed.map((player: any) => ({
          ...player,
          createdAt: new Date(player.createdAt)
        }));
      } catch (error) {
        console.error('Error parsing players:', error);
        return [];
      }
    }
    return [];
  });
  
  const [formations, setFormations] = useState<Formation[]>(() => {
    const savedFormations = localStorage.getItem('statsor_command_formations');
    if (savedFormations) {
      try {
        return JSON.parse(savedFormations);
      } catch (error) {
        console.error('Error parsing formations:', error);
        return [
          { 
            id: '1', 
            name: '4-3-3', 
            description: 'Balanced attacking formation', 
            players: [] 
          },
          { 
            id: '2', 
            name: '4-4-2', 
            description: 'Classic formation with two strikers', 
            players: [] 
          },
          { 
            id: '3', 
            name: '3-5-2', 
            description: 'Midfield-dominant formation', 
            players: [] 
          }
        ];
      }
    }
    return [
      { 
        id: '1', 
        name: '4-3-3', 
        description: 'Balanced attacking formation', 
        players: [] 
      },
      { 
        id: '2', 
        name: '4-4-2', 
        description: 'Classic formation with two strikers', 
        players: [] 
      },
      { 
        id: '3', 
        name: '3-5-2', 
        description: 'Midfield-dominant formation', 
        players: [] 
      }
    ];
  });
  
  const [selectedFormation, setSelectedFormation] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: 0,
    position: 'DEL',
    role: '',
    notes: '',
    rating: 3.0,
    status: 'available' as 'available' | 'injured' | 'suspended',
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    matchesPlayed: 0
  });
  
  const [editPlayer, setEditPlayer] = useState({
    name: '',
    number: 0,
    position: 'DEL',
    role: '',
    notes: '',
    rating: 3.0,
    status: 'available' as 'available' | 'injured' | 'suspended',
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    matchesPlayed: 0
  });

  // Add new state for player actions
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>(() => {
    const savedActions = localStorage.getItem('statsor_player_actions');
    if (savedActions) {
      try {
        const parsedActions = JSON.parse(savedActions);
        // Ensure each action has all required properties
        return parsedActions.map((action: any) => ({
          id: action.id || Date.now().toString() + Math.random(),
          playerId: action.playerId || '',
          playerName: action.playerName || 'Unknown Player',
          actionType: action.actionType || 'goal',
          matchId: action.matchId || 'current_match',
          matchName: action.matchName || 'Current Match',
          timestamp: action.timestamp || new Date().toISOString(),
          minute: action.minute || 0,
          second: action.second || 0,
          position: action.position || { x: 50, y: 50, area: 'Midfield' },
          details: action.details || '',
          created_at: action.created_at || new Date().toISOString()
        })).filter((action: any) => action.id); // Filter out actions without IDs
      } catch (error) {
        console.error('Error parsing player actions:', error);
        return [];
      }
    }
    return [];
  });

  // Add state for showing the football field visualization
  const [showFieldVisualization, setShowFieldVisualization] = useState(false);
  const [selectedPlayerAction, setSelectedPlayerAction] = useState<PlayerAction | null>(null);

  // State for swipeable tabs
  const [activeTab, setActiveTab] = useState<'players' | 'formation' | 'actions'>('players');
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  // State for swipeable actions
  const [actionScrollPosition, setActionScrollPosition] = useState(0);
  const actionsContainerRef = useRef<HTMLDivElement>(null);

  // State for event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalData, setEventModalData] = useState({
    playerId: '',
    actionType: 'goal' as PlayerAction['actionType'],
    minute: 0,
    second: 0,
    x: 50,
    y: 50,
    details: ''
  });

  // Refs for dropdown menus
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);

  // Load players from data management service
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const playersData = await dataManagementService.getPlayers();
        // Transform the data to match our Player interface
        const transformedPlayers = playersData.map((player, index) => ({
          id: player.id || `player_${index}`,
          name: player.name,
          number: player.jersey_number || index + 1,
          position: player.position || 'DEL',
          role: '',
          notes: '',
          rating: 3.0,
          status: 'available' as 'available' | 'injured' | 'suspended',
          goals: player.goals || 0,
          assists: player.assists || 0,
          yellowCards: player.yellow_cards || 0,
          redCards: player.red_cards || 0,
          matchesPlayed: 0,
          createdAt: new Date(player.created_at || Date.now())
        }));
        setPlayers(transformedPlayers);
      } catch (error) {
        console.error('Error loading players:', error);
        toast.error('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('statsor_command_formations', JSON.stringify(formations));
  }, [formations]);

  // Save player actions to localStorage
  useEffect(() => {
    localStorage.setItem('statsor_player_actions', JSON.stringify(playerActions));
  }, [playerActions]);

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim() || newPlayer.number <= 0) {
      toast.error('Please enter player name and number');
      return;
    }

    const player: Player = {
      id: Date.now().toString(),
      name: newPlayer.name,
      number: newPlayer.number,
      position: newPlayer.position,
      role: newPlayer.role,
      notes: newPlayer.notes,
      rating: newPlayer.rating,
      status: newPlayer.status,
      goals: newPlayer.goals,
      assists: newPlayer.assists,
      yellowCards: newPlayer.yellowCards,
      redCards: newPlayer.redCards,
      matchesPlayed: newPlayer.matchesPlayed,
      createdAt: new Date()
    };

    setPlayers(prev => [...prev, player]);
    setNewPlayer({ 
      name: '', 
      number: 0, 
      position: 'DEL', 
      role: '', 
      notes: '',
      rating: 3.0,
      status: 'available',
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      matchesPlayed: 0
    });
    setIsAddingPlayer(false);
    toast.success('Player added successfully!');
  };

  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditPlayer({
      name: player.name,
      number: player.number,
      position: player.position,
      role: player.role,
      notes: player.notes,
      rating: player.rating,
      status: player.status,
      goals: player.goals,
      assists: player.assists,
      yellowCards: player.yellowCards,
      redCards: player.redCards,
      matchesPlayed: player.matchesPlayed
    });
  };

  const saveEditingPlayer = () => {
    if (!editPlayer.name.trim() || editPlayer.number <= 0) {
      toast.error('Please enter player name and number');
      return;
    }

    setPlayers(prev => 
      prev.map(player => 
        player.id === editingPlayerId 
          ? { ...player, ...editPlayer } 
          : player
      )
    );
    
    setEditingPlayerId(null);
    toast.success('Player updated successfully!');
  };

  // Add new function to add player actions
  const addPlayerAction = (playerId: string, actionType: PlayerAction['actionType'], details: string = '') => {
    // Add safety checks
    if (!actionType) {
      toast.error('Action type is required');
      return;
    }
    
    // Find player
    const player = players.find(p => p && p.id === playerId);
    
    // Create action
    const now = new Date();
    const action: PlayerAction = {
      id: Date.now().toString(),
      playerId: playerId || '',
      playerName: player ? player.name : 'Unknown Player',
      actionType,
      matchId: 'current_match',
      matchName: 'Current Match',
      timestamp: now.toISOString(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      position: {
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        area: 'Midfield'
      },
      details: details || '',
      created_at: now.toISOString()
    };

    // Add action to the list
    setPlayerActions(prev => [...prev, action]);

    // Update player stats (only for player-specific actions)
    if (player && ['goal', 'assist', 'yellowCard', 'redCard'].includes(actionType)) {
      setPlayers(prev => 
        prev.map(p => {
          if (p && p.id === playerId) {
            const updatedPlayer = { ...p };
            switch (actionType) {
              case 'goal':
                updatedPlayer.goals += 1;
                break;
              case 'assist':
                updatedPlayer.assists += 1;
                break;
              case 'yellowCard':
                updatedPlayer.yellowCards += 1;
                break;
              case 'redCard':
                updatedPlayer.redCards += 1;
                break;
            }
            return updatedPlayer;
          }
          return p;
        })
      );
    }

    toast.success(`${actionType} recorded for ${player ? player.name : 'Unknown Player'} at ${action.minute}:${action.second.toString().padStart(2, '0')}!`);
  };

  // Add function to delete player actions
  const deletePlayerAction = (actionId: string) => {
    // Add safety check
    if (!actionId) {
      toast.error('Invalid action ID');
      return;
    }
    
    const action = playerActions.find(a => a && a.id === actionId);
    if (!action) {
      toast.error('Action not found');
      return;
    }

    setPlayerActions(prev => prev.filter(a => a && a.id !== actionId));

    // Revert player stats if needed
    setPlayers(prev => 
      prev.map(p => {
        if (p && action && p.id === action.playerId) {
          const updatedPlayer = { ...p };
          switch (action.actionType) {
            case 'goal':
              updatedPlayer.goals = Math.max(0, updatedPlayer.goals - 1);
              break;
            case 'assist':
              updatedPlayer.assists = Math.max(0, updatedPlayer.assists - 1);
              break;
            case 'yellowCard':
              updatedPlayer.yellowCards = Math.max(0, updatedPlayer.yellowCards - 1);
              break;
            case 'redCard':
              updatedPlayer.redCards = Math.max(0, updatedPlayer.redCards - 1);
              break;
          }
          return updatedPlayer;
        }
        return p;
      })
    );

    toast.success(`${action.actionType} removed for ${action.playerName} at ${action.minute}:${action.second.toString().padStart(2, '0')}!`);
  };

  // Function to open event modal
  const openEventModal = (playerId: string, actionType: PlayerAction['actionType']) => {
    const now = new Date();
    setEventModalData({
      playerId,
      actionType,
      minute: now.getMinutes(),
      second: now.getSeconds(),
      x: 50,
      y: 50,
      details: ''
    });
    setShowEventModal(true);
  };

  // Function to record event from modal
  const recordEventFromModal = () => {
    try {
      // Validate time inputs
      if (eventModalData.minute < 0 || eventModalData.minute > 120) {
        toast.error('Minute must be between 0 and 120');
        return;
      }
      
      if (eventModalData.second < 0 || eventModalData.second > 59) {
        toast.error('Second must be between 0 and 59');
        return;
      }
      
      // Find player if selected
      const player = eventModalData.playerId 
        ? players.find(p => p && p.id === eventModalData.playerId)
        : null;
      
      // Use player name if available, otherwise "Team Event"
      const playerName = player ? player.name : 'Team Event';
      
      // Create action object
      const now = new Date();
      const action: PlayerAction = {
        id: Date.now().toString(),
        playerId: eventModalData.playerId || '',
        playerName: playerName,
        actionType: eventModalData.actionType || 'goal',
        matchId: 'current_match',
        matchName: 'Current Match',
        timestamp: now.toISOString(),
        minute: eventModalData.minute || 0,
        second: eventModalData.second || 0,
        position: {
          x: eventModalData.x || 50,
          y: eventModalData.y || 50,
          area: 'Midfield'
        },
        details: eventModalData.details || '',
        created_at: now.toISOString()
      };

      // Add action to the list
      setPlayerActions(prev => [...prev, action]);

      // Update player stats only if a player is selected and the action affects stats
      if (player && ['goal', 'assist', 'yellowCard', 'redCard'].includes(eventModalData.actionType)) {
        setPlayers(prev => 
          prev.map(p => {
            if (p && p.id === player.id) {
              const updatedPlayer = { ...p };
              switch (eventModalData.actionType) {
                case 'goal':
                  updatedPlayer.goals += 1;
                  break;
                case 'assist':
                  updatedPlayer.assists += 1;
                  break;
                case 'yellowCard':
                  updatedPlayer.yellowCards += 1;
                  break;
                case 'redCard':
                  updatedPlayer.redCards += 1;
                  break;
              }
              return updatedPlayer;
            }
            return p;
          })
        );
      }

      // Close modal and show success message
      setShowEventModal(false);
      toast.success(`${eventModalData.actionType} recorded for ${playerName} at ${eventModalData.minute}:${eventModalData.second.toString().padStart(2, '0')}!`);
    } catch (error) {
      console.error('Error recording event:', error);
      toast.error('Failed to record action. Please try again.');
    }
  };

  const cancelEditingPlayer = () => {
    setEditingPlayerId(null);
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(player => player.id !== id));
    
    // Remove player from all formations
    setFormations(prev => 
      prev.map(formation => ({
        ...formation,
        players: formation.players.filter(playerId => playerId !== id)
      }))
    );
    toast.success('Player deleted successfully!');
  };

  // Add player to formation
  const addPlayerToFormation = (playerId: string) => {
    setFormations(prev => 
      prev.map(formation => 
        formation.id === selectedFormation
          ? { 
              ...formation, 
              players: formation.players.includes(playerId) 
                ? formation.players 
                : [...formation.players, playerId] 
            }
          : formation
      )
    );
    toast.success('Player added to formation!');
  };

  // Remove player from formation
  const removePlayerFromFormation = (playerId: string) => {
    setFormations(prev => 
      prev.map(formation => 
        formation.id === selectedFormation
          ? { 
              ...formation, 
              players: formation.players.filter(id => id !== playerId) 
            }
          : formation
      )
    );
    toast.success('Player removed from formation!');
  };

  // Filter and sort players
  const filteredPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || player.status === selectedStatus;
      const matchesPosition = selectedPosition === 'all' || player.position === selectedPosition;
      
      return matchesSearch && matchesStatus && matchesPosition;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'number':
          aValue = a.number;
          bValue = b.number;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'goals':
          aValue = a.goals;
          bValue = b.goals;
          break;
        case 'assists':
          aValue = a.assists;
          bValue = b.assists;
          break;
        case 'matches':
          aValue = a.matchesPlayed;
          bValue = b.matchesPlayed;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get selected formation
  const currentFormation = formations.find(f => f.id === selectedFormation) || formations[0];

  // Get players in current formation
  const formationPlayers = currentFormation 
    ? currentFormation.players.map(playerId => 
        players.find(p => p.id === playerId)
      ).filter(Boolean) as Player[]
    : [];

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    const targetTouches = e.targetTouches;
    if (targetTouches && targetTouches.length > 0) {
      const firstTouch = targetTouches[0];
      if (firstTouch) {
        setTouchStart(firstTouch.clientX);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const targetTouches = e.targetTouches;
    if (targetTouches && targetTouches.length > 0) {
      const firstTouch = targetTouches[0];
      if (firstTouch) {
        setTouchEnd(firstTouch.clientX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - go to next tab
      if (activeTab === 'players') setActiveTab('formation');
      else if (activeTab === 'formation') setActiveTab('actions');
    } else if (isRightSwipe) {
      // Swipe right - go to previous tab
      if (activeTab === 'actions') setActiveTab('formation');
      else if (activeTab === 'formation') setActiveTab('players');
    }
  };

  // Handle swipe for actions
  const handleActionSwipe = (direction: 'left' | 'right') => {
    if (!actionsContainerRef.current) return;
    
    const container = actionsContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Function to handle field click for positioning
  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    try {
      if (!e.currentTarget) {
        toast.error('Unable to get field element');
        return;
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        toast.error('Field dimensions not available');
        return;
      }
      
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Ensure values are within bounds
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));
      
      // Update the event modal data with the new position
      setEventModalData(prev => ({
        ...prev,
        x: clampedX,
        y: clampedY
      }));
      
      // Show visual feedback
      toast.success(`Position set: ${Math.round(clampedX)}%, ${Math.round(clampedY)}%`);
    } catch (error) {
      console.error('Error handling field click:', error);
      toast.error('Failed to set position. Please try again.');
    }
  };

  // Helper function to get action color class
  const getActionColorClass = (actionType: PlayerAction['actionType']) => {
    try {
      switch (actionType) {
        case 'goal': return 'bg-green-100';
        case 'assist': return 'bg-blue-100';
        case 'yellowCard': return 'bg-yellow-100';
        case 'redCard': return 'bg-red-100';
        case 'foul': return 'bg-orange-100';
        case 'save': return 'bg-purple-100';
        case 'substitution': return 'bg-gray-100';
        case 'corner': return 'bg-yellow-100';
        case 'offside': return 'bg-orange-100';
        case 'penalty': return 'bg-red-100';
        default: return 'bg-gray-100';
      }
    } catch (error) {
      console.error('Error getting action color class:', error);
      return 'bg-gray-100';
    }
  };

  // Helper function to get action color
  const getActionColor = (actionType: PlayerAction['actionType']) => {
    switch (actionType) {
      case 'goal': return 'green';
      case 'assist': return 'blue';
      case 'yellowCard': return 'yellow';
      case 'redCard': return 'red';
      case 'foul': return 'orange';
      case 'save': return 'purple';
      case 'substitution': return 'gray';
      case 'corner': return 'yellow';
      case 'offside': return 'orange';
      case 'penalty': return 'red';
      default: return 'gray';
    }
  };

  // Helper function to get action icon
  const getActionIcon = (actionType: PlayerAction['actionType']) => {
    switch (actionType) {
      case 'goal': return <Trophy className="w-4 h-4" />;
      case 'assist': return <Award className="w-4 h-4" />;
      case 'yellowCard': return <AlertCircle className="w-4 h-4" />;
      case 'redCard': return <AlertCircle className="w-4 h-4" />;
      case 'foul': return <Shield className="w-4 h-4" />;
      case 'save': return <Shield className="w-4 h-4" />;
      case 'substitution': return <Clock className="w-4 h-4" />;
      case 'corner': return <Target className="w-4 h-4" />;
      case 'offside': return <Play className="w-4 h-4" />;
      case 'penalty': return <Square className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
      case 'injured':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Injured</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
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
    <div className="p-4 md:p-6">
      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md md:max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold">Record Match Action</h2>
              <Button 
                variant="ghost" 
                onClick={() => setShowEventModal(false)}
                className="p-1 h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm md:text-base font-medium mb-1">Minute</label>
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      value={eventModalData.minute}
                      onChange={(e) => setEventModalData(prev => ({ ...prev, minute: parseInt(e.target.value) || 0 }))}
                      className="text-sm md:text-base p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-medium mb-1">Second</label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={eventModalData.second}
                      onChange={(e) => setEventModalData(prev => ({ ...prev, second: parseInt(e.target.value) || 0 }))}
                      className="text-sm md:text-base p-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm md:text-base font-medium mb-1">Action Type</label>
                  <select
                    value={eventModalData.actionType}
                    onChange={(e) => setEventModalData(prev => ({ ...prev, actionType: e.target.value as PlayerAction['actionType'] }))}
                    className="w-full p-2 border rounded text-sm md:text-base"
                  >
                    <option value="goal">Goal</option>
                    <option value="assist">Assist</option>
                    <option value="yellowCard">Yellow Card</option>
                    <option value="redCard">Red Card</option>
                    <option value="foul">Foul</option>
                    <option value="save">Save</option>
                    <option value="substitution">Substitution</option>
                    <option value="corner">Corner</option>
                    <option value="offside">Offside</option>
                    <option value="penalty">Penalty</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm md:text-base font-medium mb-1">Player (Optional)</label>
                  <select
                    value={eventModalData.playerId}
                    onChange={(e) => setEventModalData(prev => ({ ...prev, playerId: e.target.value }))}
                    className="w-full p-2 border rounded text-sm md:text-base"
                  >
                    <option value="">Team Event</option>
                    {players && players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} (#{player.number})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm md:text-base font-medium mb-1">Details</label>
                  <Textarea
                    value={eventModalData.details}
                    onChange={(e) => setEventModalData(prev => ({ ...prev, details: e.target.value }))}
                    placeholder="Additional details about the action..."
                    className="text-sm md:text-base p-2 min-h-[100px]"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm md:text-base font-medium mb-1">Field Position</label>
                  <p className="text-gray-600 text-xs md:text-sm mb-2">Click anywhere on the field below to set where the action occurred</p>
                  <div 
                    className="relative bg-green-700 rounded-lg overflow-hidden cursor-pointer border-4 border-white shadow-lg mx-auto hover:border-blue-400 transition-colors duration-200"
                    style={{ width: '100%', height: '300px' }}
                    onClick={handleFieldClick}
                    title="Click to set action position"
                  >
                    <div className="absolute inset-0">
                      {/* Football field markings - enhanced realistic design */}
                      {/* Outer border */}
                      <div className="absolute inset-0 border-4 border-white"></div>
                      
                      {/* Center line */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white"></div>
                      
                      {/* Center circle */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white"></div>
                      
                      {/* Center spot */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                      
                      {/* Penalty areas - more accurate dimensions */}
                      <div className="absolute top-0 left-0 w-24 h-40 md:w-28 md:h-48 border-4 border-white border-t-0 border-l-0"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-40 md:w-28 md:h-48 border-4 border-white border-b-0 border-l-0"></div>
                      <div className="absolute top-0 right-0 w-24 h-40 md:w-28 md:h-48 border-4 border-white border-t-0 border-r-0"></div>
                      <div className="absolute bottom-0 right-0 w-24 h-40 md:w-28 md:h-48 border-4 border-white border-b-0 border-r-0"></div>
                      
                      {/* Goal areas */}
                      <div className="absolute top-1/3 left-0 w-12 h-24 md:w-16 md:h-32 border-4 border-white border-t-0 border-l-0"></div>
                      <div className="absolute bottom-1/3 left-0 w-12 h-24 md:w-16 md:h-32 border-4 border-white border-b-0 border-l-0"></div>
                      <div className="absolute top-1/3 right-0 w-12 h-24 md:w-16 md:h-32 border-4 border-white border-t-0 border-r-0"></div>
                      <div className="absolute bottom-1/3 right-0 w-12 h-24 md:w-16 md:h-32 border-4 border-white border-b-0 border-r-0"></div>
                      
                      {/* Goals */}
                      <div className="absolute top-2/5 -left-2 w-4 h-16 bg-white"></div>
                      <div className="absolute top-2/5 -right-2 w-4 h-16 bg-white"></div>
                      
                      {/* Corner arcs */}
                      <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-4 border-white border-r-0 border-b-0 rounded-tl-full"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-4 border-white border-r-0 border-t-0 rounded-bl-full"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-4 border-white border-l-0 border-b-0 rounded-tr-full"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-4 border-white border-l-0 border-t-0 rounded-br-full"></div>
                      
                      {/* Penalty spots */}
                      <div className="absolute top-1/2 left-24 md:left-28 w-2 h-2 bg-white rounded-full"></div>
                      <div className="absolute top-1/2 right-24 md:right-28 w-2 h-2 bg-white rounded-full"></div>
                      
                      {/* Action position marker - shows where user clicked */}
                      <div 
                        className="absolute w-6 h-6 bg-blue-500 rounded-full border-4 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg animate-pulse"
                        style={{
                          left: `${eventModalData.x || 50}%`,
                          top: `${eventModalData.y || 50}%`,
                          zIndex: 10
                        }}
                      >
                        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-sm font-bold text-white bg-black bg-opacity-70 px-2 py-1 rounded whitespace-nowrap">
                          Clicked Position
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEventModal(false)}
                    className="text-sm py-2 px-4"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={recordEventFromModal}
                    className="text-sm py-2 px-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Record Action
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Form */}
      {isAddingPlayer && (
        <Card className="mb-4 p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Add New Player</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Player name"
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number</label>
                <Input
                  type="number"
                  min="1"
                  max="99"
                  value={newPlayer.number || ''}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, number: parseInt(e.target.value) || 0 }))}
                  placeholder="Player number"
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <select
                  value={newPlayer.position}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="DEL">Forward (DEL)</option>
                  <option value="MED">Midfielder (MED)</option>
                  <option value="DEF">Defender (DEF)</option>
                  <option value="POR">Goalkeeper (POR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Input
                  value={newPlayer.role}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Player role"
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newPlayer.status}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="available">Available</option>
                  <option value="injured">Injured</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={newPlayer.rating}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, rating: parseFloat(e.target.value) || 3.0 }))}
                  className="text-sm p-2"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                value={newPlayer.notes}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Player notes"
                className="text-sm p-2 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAddingPlayer(false)}
                className="text-sm py-1 px-3"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddPlayer}
                className="text-sm py-1 px-3 bg-blue-600 hover:bg-blue-700"
              >
                Add Player
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
          <TableIcon className="mr-2 h-5 w-5 md:mr-3 md:h-6 md:w-6 text-blue-600" />
          Command Table
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setIsAddingPlayer(true)}
            className="bg-blue-600 hover:bg-blue-700 text-xs md:text-sm py-1 px-2 md:py-2 md:px-4"
          >
            <Plus className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
            Add Player
          </Button>
          
          <Button 
            onClick={() => setShowEventModal(true)}
            className="bg-green-600 hover:bg-green-700 text-xs md:text-sm py-1 px-2 md:py-2 md:px-4"
          >
            <Trophy className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
            Record Action
          </Button>
        </div>
      </div>
  
      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 py-2 px-2 md:px-4 text-center font-medium ${
            activeTab === 'players' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('players')}
        >
          <User className="inline mr-1 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
          <span className="text-xs md:text-sm">Players</span>
        </button>
        <button
          className={`flex-1 py-2 px-2 md:px-4 text-center font-medium ${
            activeTab === 'formation' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('formation')}
        >
          <Target className="inline mr-1 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
          <span className="text-xs md:text-sm">Formation</span>
        </button>
        <button
          className={`flex-1 py-2 px-2 md:px-4 text-center font-medium ${
            activeTab === 'actions' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('actions')}
        >
          <TrendingUp className="inline mr-1 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
          <span className="text-xs md:text-sm">Match Actions</span>
        </button>
      </div>

      {/* Swipeable Content */}
      <div 
        ref={tabContainerRef}
        className="w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Players Tab */}
        {activeTab === 'players' && (
          <Card className="p-4">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    <User className="mr-2 h-4 w-4 text-blue-600" />
                    Players List
                  </CardTitle>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    {filteredPlayers.length} players • {players.filter(p => p.status === 'injured').length} injured • {players.filter(p => p.status === 'suspended').length} suspended
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search players..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 pr-2 py-1 w-full sm:w-40 md:w-52 text-xs md:text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowStatistics(!showStatistics)}
                    className="flex items-center text-xs py-1 px-2"
                  >
                    {showStatistics ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                    <span className="hidden sm:inline">{showStatistics ? 'Hide' : 'Show'} Stats</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th 
                        className="py-2 px-3 text-left cursor-pointer hover:bg-gray-50 text-xs font-semibold"
                        onClick={() => {
                          setSortBy('name');
                          toggleSortOrder();
                        }}
                      >
                        <div className="flex items-center">
                          Name {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className="py-2 px-3 text-left cursor-pointer hover:bg-gray-50 text-xs font-semibold"
                        onClick={() => {
                          setSortBy('number');
                          toggleSortOrder();
                        }}
                      >
                        <div className="flex items-center">
                          # {getSortIcon('number')}
                        </div>
                      </th>
                      <th className="py-2 px-3 text-left text-xs font-semibold">Position</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold">Role</th>
                      {showStatistics && (
                        <>
                          <th 
                            className="py-2 px-3 text-left cursor-pointer hover:bg-gray-50 text-xs font-semibold"
                            onClick={() => {
                              setSortBy('rating');
                              toggleSortOrder();
                            }}
                          >
                            <div className="flex items-center">
                              Rating {getSortIcon('rating')}
                            </div>
                          </th>
                          <th 
                            className="py-2 px-33 text-left cursor-pointer hover:bg-gray-50 text-xs font-semibold"
                            onClick={() => {
                              setSortBy('goals');
                              toggleSortOrder();
                            }}
                          >
                            <div className="flex items-center">
                              Goals {getSortIcon('goals')}
                            </div>
                          </th>
                          <th 
                            className="py-2 px-3 text-left cursor-pointer hover:bg-gray-50 text-xs font-semibold"
                            onClick={() => {
                              setSortBy('assists');
                              toggleSortOrder();
                            }}
                          >
                            <div className="flex items-center">
                              Assists {getSortIcon('assists')}
                            </div>
                          </th>
                        </>
                      )}
                      <th className="py-2 px-3 text-left text-xs font-semibold">Status</th>
                      <th className="py-2 px-3 text-left text-xs font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => (
                      <tr key={player.id} className="border-b hover:bg-gray-50">
                        {editingPlayerId === player.id ? (
                          <>
                            <td className="py-2 px-3">
                              <Input
                                value={editPlayer.name}
                                onChange={(e) => setEditPlayer(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full text-xs p-1"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                type="number"
                                min="1"
                                max="99"
                                value={editPlayer.number || ''}
                                onChange={(e) => setEditPlayer(prev => ({ ...prev, number: parseInt(e.target.value) || 0 }))}
                                className="w-12 text-xs p-1"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={editPlayer.position}
                                onChange={(e) => setEditPlayer(prev => ({ ...prev, position: e.target.value }))}
                                className="w-full p-1 border rounded text-xs"
                              >
                                <option value="DEL">Forward (DEL)</option>
                                <option value="MED">Midfielder (MED)</option>
                                <option value="DEF">Defender (DEF)</option>
                                <option value="POR">Goalkeeper (POR)</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                value={editPlayer.role}
                                onChange={(e) => setEditPlayer(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full text-xs p-1"
                              />
                            </td>
                            {showStatistics && (
                              <>
                                <td className="py-2 px-3">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={editPlayer.rating}
                                    onChange={(e) => setEditPlayer(prev => ({ ...prev, rating: parseFloat(e.target.value) || 3.0 }))}
                                    className="w-12 text-xs p-1"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editPlayer.goals}
                                    onChange={(e) => setEditPlayer(prev => ({ ...prev, goals: parseInt(e.target.value) || 0 }))}
                                    className="w-12 text-xs p-1"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editPlayer.assists}
                                    onChange={(e) => setEditPlayer(prev => ({ ...prev, assists: parseInt(e.target.value) || 0 }))}
                                    className="w-12 text-xs p-1"
                                  />
                                </td>
                              </>
                            )}
                            <td className="py-2 px-3">
                              <select
                                value={editPlayer.status}
                                onChange={(e) => setEditPlayer(prev => ({ ...prev, status: e.target.value as any }))}
                                className="w-full p-1 border rounded text-xs"
                              >
                                <option value="available">Available</option>
                                <option value="injured">Injured</option>
                                <option value="suspended">Suspended</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={saveEditingPlayer}
                                  className="p-1 h-6 w-6"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={cancelEditingPlayer}
                                  className="p-1 h-6 w-6"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 text-sm font-medium">{player.name}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-xs py-1 px-2">{player.number}</Badge>
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="secondary" className="text-xs py-1 px-2">{player.position}</Badge>
                            </td>
                            <td className="py-2 px-3 text-sm">{player.role}</td>
                            {showStatistics && (
                              <>
                                <td className="py-2 px-3">{renderRating(player.rating)}</td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center text-sm">
                                    <Trophy className="w-3 h-3 text-blue-500 mr-1" />
                                    {player.goals}
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center text-sm">
                                    <Award className="w-3 h-3 text-green-500 mr-1" />
                                    {player.assists}
                                  </div>
                                </td>
                              </>
                            )}
                            <td className="py-2 px-3">{renderStatusBadge(player.status)}</td>
                            <td className="py-2 px-3">
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => startEditingPlayer(player)}
                                  className="p-1 h-6 w-6"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredPlayers.length === 0 && (
                <div className="text-center py-6">
                  <User className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No players found</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Get started by adding a new player.
                  </p>
                  <div className="mt-4">
                    <Button 
                      onClick={() => setIsAddingPlayer(true)}
                      className="text-xs py-1 px-3"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Player
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Formation Tab */}
        {activeTab === 'formation' && (
          <Card className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Target className="mr-2 h-4 w-4 text-blue-600" />
                Formation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Formation</label>
                  <select
                    value={selectedFormation}
                    onChange={(e) => setSelectedFormation(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    {formations.map(formation => (
                      <option key={formation.id} value={formation.id}>
                        {formation.name} - {formation.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2 text-sm">Players in Formation ({formationPlayers.length})</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formationPlayers.map(player => (
                        <div key={player.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2 text-xs py-1 px-2">{player.number}</Badge>
                            <span className="text-sm">{player.name}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => removePlayerFromFormation(player.id)}
                            className="p-1 h-5 w-5"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {formationPlayers.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          No players in this formation
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 text-sm">Available Players</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {players
                        .filter(player => !formationPlayers.some(p => p.id === player.id))
                        .map(player => (
                          <div key={player.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2 text-xs py-1 px-2">{player.number}</Badge>
                              <span className="text-sm">{player.name}</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => addPlayerToFormation(player.id)}
                              className="p-1 h-5 w-5"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      {players.filter(player => !formationPlayers.some(p => p.id === player.id)).length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          All players are in the formation
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match Actions Tab */}
        {activeTab === 'actions' && (
          <Card className="p-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                  Match Actions
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleActionSwipe('left')}
                    className="p-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleActionSwipe('right')}
                    className="p-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                ref={actionsContainerRef}
                className="space-y-3 max-h-80 overflow-y-auto"
              >
                {playerActions && playerActions.length > 0 ? (
                  [...playerActions].reverse().map(action => {
                    // Add safety checks for action properties
                    if (!action) return null;
                    
                    return (
                      <div 
                        key={action.id} 
                        className="flex items-start p-3 hover:bg-gray-50 rounded cursor-pointer border border-gray-200"
                        onClick={() => {
                          setSelectedPlayerAction(action);
                          setShowFieldVisualization(true);
                        }}
                      >
                        <div className={`p-2 rounded mr-3 ${getActionColorClass(action.actionType || 'goal')}`}>
                          {getActionIcon(action.actionType || 'goal')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {action.playerName || 'Team Event'}
                            </p>
                            <span className="text-xs text-gray-500">
                              {action.minute || 0}:{(action.second || 0).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 capitalize">
                            {action.actionType || 'unknown'} • {action.matchName || 'Current Match'}
                          </p>
                          {action.details && (
                            <p className="text-xs text-gray-500 mt-1">
                              {action.details}
                            </p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (action.id) {
                              deletePlayerAction(action.id);
                            }
                          }}
                          className="p-1 h-5 w-5 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  }).filter(Boolean) // Remove any null elements
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No actions recorded</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by recording a match action.
                    </p>
                    <div className="mt-4">
                      <Button 
                        onClick={() => setShowEventModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Record Action
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Field Visualization Modal */}
      {showFieldVisualization && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-md my-4">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold">
                  Field Visualization
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFieldVisualization(false)}
                  className="p-1 h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {selectedPlayerAction ? (
                <div className="mb-4">
                  <div className="flex items-center mb-3">
                    <div className={`p-3 rounded-lg mr-4 ${getActionColorClass(selectedPlayerAction.actionType)}`}>
                      {getActionIcon(selectedPlayerAction.actionType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{selectedPlayerAction.playerName || 'Team Event'}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedPlayerAction.actionType} at {selectedPlayerAction.minute || 0}:{(selectedPlayerAction.second || 0).toString().padStart(2, '0')} in {selectedPlayerAction.matchName || 'Current Match'}
                      </p>
                    </div>
                  </div>
                  {selectedPlayerAction.details && (
                    <p className="text-sm text-gray-700 border-l-4 border-gray-200 pl-3 py-2 mb-4">
                      {selectedPlayerAction.details}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 mb-4 text-sm">Select an action to visualize its position</p>
              )}
              
              <div className="relative bg-green-700 rounded-lg overflow-hidden shadow-xl mx-auto" style={{ width: '100%', height: '300px' }}>
                <div className="absolute inset-0">
                  {/* Football field markings - enhanced realistic design */}
                  {/* Outer border */}
                  <div className="absolute inset-0 border-4 border-white"></div>
                  
                  {/* Center line */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white"></div>
                  
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white"></div>
                  
                  {/* Center spot */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                  
                  {/* Penalty areas - more accurate dimensions */}
                  <div className="absolute top-0 left-0 w-24 h-40 md:w-28 md:h-48 border-4 border-white border-t-0 border-l-0"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-40 md:w-28 md:h-48 border-4 border-white border-b-0 border-l-0"></div>
                  <div className="absolute top-0 right-0 w-24 h-40 md:w-28 md:h-48 border-4 border-white border-t-0 border-r-0"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-40 md:w-28 md:h-48 border-4 border-white border-b-0 border-r-0"></div>
                  
                  {/* Goal areas */}
                  <div className="absolute top-1/3 left-0 w-12 h-24 md:w-16 md:h-32 border-4 border-white border-t-0 border-l-0"></div>
                  <div className="absolute bottom-1/3 left-0 w-12 h-24 md:w-16 md:h-32 border-4 border-white border-b-0 border-l-0"></div>
                  <div className="absolute top-1/3 right-0 w-12 h-24 md:w-16 md:h-32 border-4 border-white border-t-0 border-r-0"></div>
                  <div className="absolute bottom-1/3 right-0 w-12 h-24 md:w-16 md:h-32 border-4 border-white border-b-0 border-r-0"></div>
                  
                  {/* Goals */}
                  <div className="absolute top-2/5 -left-2 w-4 h-16 bg-white"></div>
                  <div className="absolute top-2/5 -right-2 w-4 h-16 bg-white"></div>
                  
                  {/* Corner arcs */}
                  <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-4 border-white border-r-0 border-b-0 rounded-tl-full"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-4 border-white border-r-0 border-t-0 rounded-bl-full"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-4 border-white border-l-0 border-b-0 rounded-tr-full"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-4 border-white border-l-0 border-t-0 rounded-br-full"></div>
                  
                  {/* Penalty spots */}
                  <div className="absolute top-1/2 left-24 md:left-28 w-2 h-2 bg-white rounded-full"></div>
                  <div className="absolute top-1/2 right-24 md:right-28 w-2 h-2 bg-white rounded-full"></div>
                  
                  {/* Action position marker */}
                  {selectedPlayerAction && selectedPlayerAction.position && (
                    <div 
                      className="absolute w-6 h-6 bg-red-500 rounded-full border-4 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
                      style={{
                        left: `${selectedPlayerAction.position.x || 0}%`,
                        top: `${selectedPlayerAction.position.y || 0}%`
                      }}
                    >
                      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-sm font-bold text-white bg-black bg-opacity-70 px-2 py-1 rounded whitespace-nowrap">
                        {selectedPlayerAction.minute || 0}:{(selectedPlayerAction.second || 0).toString().padStart(2, '0')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  The marker shows where the action occurred on the field.
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => setShowFieldVisualization(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandTable;