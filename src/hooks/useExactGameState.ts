/**
 * React Hook for Exact Game State Management
 * Provides easy integration with the ExactGameStateService
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import exactGameStateService, {
  GameState,
  GameEvent,
  GamePlayer,
  PlayerMatchStats,
  GameSnapshot
} from '../services/exactGameStateService';

export interface UseExactGameStateReturn {
  // Game State
  gameState: GameState | null;
  isGameRunning: boolean;
  isPaused: boolean;
  currentTime: number;
  currentHalf: 'first' | 'second' | 'overtime';
  score: { home: number; away: number };
  fouls: { home: number; away: number };
  
  // Events
  events: GameEvent[];
  recentEvents: GameEvent[];
  
  // Actions
  initializeGame: (matchId: string, homePlayers: GamePlayer[], awayPlayers: GamePlayer[]) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  switchHalf: () => void;
  updateTime: (seconds: number) => void;
  
  // Event Management
  addEvent: (event: Omit<GameEvent, 'id' | 'timestamp'>) => GameEvent | null;
  removeEvent: (eventId: string) => boolean;
  getEventsByType: (type: GameEvent['type']) => GameEvent[];
  getEventsByPlayer: (playerId: string) => GameEvent[];
  
  // Player Stats
  getPlayerStats: (playerId: string) => PlayerMatchStats | null;
  getTeamStats: (team: 'home' | 'away') => any;
  
  // Snapshots
  snapshots: GameSnapshot[];
  createSnapshot: (reason: string) => GameSnapshot | null;
  restoreFromSnapshot: (index: number) => boolean;
  
  // Data Management
  exportData: () => any;
  importData: (data: any) => boolean;
  
  // Utilities
  isInitialized: boolean;
  hasUnsavedChanges: boolean;
}

export const useExactGameState = (): UseExactGameStateReturn => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [snapshots, setSnapshots] = useState<GameSnapshot[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const timeUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Initialize and setup event listeners
  useEffect(() => {
    const currentState = exactGameStateService.getGameState();
    if (currentState) {
      setGameState(currentState);
      setEvents(currentState.events);
      setIsInitialized(true);
    }

    // Event listeners
    const handleGameInitialized = (state: GameState) => {
      setGameState(state);
      setEvents(state.events);
      setIsInitialized(true);
      setHasUnsavedChanges(true);
    };

    const handleGameStarted = (state: GameState) => {
      setGameState(state);
      setHasUnsavedChanges(true);
    };

    const handleGamePaused = (state: GameState) => {
      setGameState(state);
      setHasUnsavedChanges(true);
    };

    const handleGameResumed = (state: GameState) => {
      setGameState(state);
      setHasUnsavedChanges(true);
    };

    const handleEventAdded = (event: GameEvent) => {
      const currentState = exactGameStateService.getGameState();
      if (currentState) {
        setGameState({ ...currentState });
        setEvents([...currentState.events]);
        setHasUnsavedChanges(true);
      }
    };

    const handleEventRemoved = (removedEvent: GameEvent) => {
      const currentState = exactGameStateService.getGameState();
      if (currentState) {
        setGameState({ ...currentState });
        setEvents([...currentState.events]);
        setHasUnsavedChanges(true);
      }
    };

    const handleTimeUpdated = ({ time, state }: { time: number; state: GameState }) => {
      setGameState({ ...state });
    };

    const handleSnapshotCreated = ({ snapshot }: { snapshot: GameSnapshot; reason: string }) => {
      setSnapshots(prev => [...prev, snapshot]);
    };

    const handleStateRestored = ({ gameState: restoredState }: { snapshot: GameSnapshot; gameState: GameState }) => {
      setGameState({ ...restoredState });
      setEvents([...restoredState.events]);
      setHasUnsavedChanges(true);
    };

    // Register event listeners
    exactGameStateService.on('gameInitialized', handleGameInitialized);
    exactGameStateService.on('gameStarted', handleGameStarted);
    exactGameStateService.on('gamePaused', handleGamePaused);
    exactGameStateService.on('gameResumed', handleGameResumed);
    exactGameStateService.on('eventAdded', handleEventAdded);
    exactGameStateService.on('eventRemoved', handleEventRemoved);
    exactGameStateService.on('timeUpdated', handleTimeUpdated);
    exactGameStateService.on('snapshotCreated', handleSnapshotCreated);
    exactGameStateService.on('stateRestored', handleStateRestored);

    // Cleanup
    return () => {
      exactGameStateService.off('gameInitialized', handleGameInitialized);
      exactGameStateService.off('gameStarted', handleGameStarted);
      exactGameStateService.off('gamePaused', handleGamePaused);
      exactGameStateService.off('gameResumed', handleGameResumed);
      exactGameStateService.off('eventAdded', handleEventAdded);
      exactGameStateService.off('eventRemoved', handleEventRemoved);
      exactGameStateService.off('timeUpdated', handleTimeUpdated);
      exactGameStateService.off('snapshotCreated', handleSnapshotCreated);
      exactGameStateService.off('stateRestored', handleStateRestored);
      
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
      }
    };
  }, []);

  // Auto-save mechanism
  useEffect(() => {
    if (hasUnsavedChanges) {
      const now = Date.now();
      if (now - lastSaveRef.current > 5000) { // Auto-save every 5 seconds
        lastSaveRef.current = now;
        setHasUnsavedChanges(false);
      }
    }
  }, [hasUnsavedChanges]);

  // Game control functions
  const initializeGame = useCallback((matchId: string, homePlayers: GamePlayer[], awayPlayers: GamePlayer[]) => {
    exactGameStateService.initializeGame(matchId, homePlayers, awayPlayers);
  }, []);

  const startGame = useCallback(() => {
    exactGameStateService.startGame();
    
    // Start time update interval
    if (timeUpdateRef.current) {
      clearInterval(timeUpdateRef.current);
    }
    
    timeUpdateRef.current = setInterval(() => {
      const currentState = exactGameStateService.getGameState();
      if (currentState && currentState.isRunning && !currentState.isPaused) {
        const newTime = currentState.currentTime + 1;
        exactGameStateService.updateTime(newTime);
      }
    }, 1000);
  }, []);

  const pauseGame = useCallback(() => {
    exactGameStateService.pauseGame();
    if (timeUpdateRef.current) {
      clearInterval(timeUpdateRef.current);
      timeUpdateRef.current = null;
    }
  }, []);

  const resumeGame = useCallback(() => {
    exactGameStateService.resumeGame();
    startGame(); // Restart the timer
  }, [startGame]);

  const resetGame = useCallback(() => {
    if (timeUpdateRef.current) {
      clearInterval(timeUpdateRef.current);
      timeUpdateRef.current = null;
    }
    
    // Reset to initial state
    const currentState = exactGameStateService.getGameState();
    if (currentState) {
      const resetPlayers = {
        home: currentState.players.home.map(p => ({
          ...p,
          stats: {
            goals: 0,
            assists: 0,
            shots: 0,
            shotsOnTarget: 0,
            passes: 0,
            passesCompleted: 0,
            fouls: 0,
            foulsReceived: 0,
            tackles: 0,
            interceptions: 0,
            saves: 0,
            minutesPlayed: 0,
            cards: { yellow: 0, red: 0 }
          }
        })),
        away: currentState.players.away.map(p => ({
          ...p,
          stats: {
            goals: 0,
            assists: 0,
            shots: 0,
            shotsOnTarget: 0,
            passes: 0,
            passesCompleted: 0,
            fouls: 0,
            foulsReceived: 0,
            tackles: 0,
            interceptions: 0,
            saves: 0,
            minutesPlayed: 0,
            cards: { yellow: 0, red: 0 }
          }
        }))
      };
      
      exactGameStateService.initializeGame(currentState.matchId, resetPlayers.home, resetPlayers.away);
    }
  }, []);

  const switchHalf = useCallback(() => {
    exactGameStateService.switchHalf();
  }, []);

  const updateTime = useCallback((seconds: number) => {
    exactGameStateService.updateTime(seconds);
  }, []);

  // Event management functions
  const addEvent = useCallback((event: Omit<GameEvent, 'id' | 'timestamp'>): GameEvent | null => {
    try {
      return exactGameStateService.addEvent(event);
    } catch (error) {
      console.error('Failed to add event:', error);
      return null;
    }
  }, []);

  const removeEvent = useCallback((eventId: string): boolean => {
    return exactGameStateService.removeEvent(eventId);
  }, []);

  const getEventsByType = useCallback((type: GameEvent['type']): GameEvent[] => {
    return exactGameStateService.getEvents({ type });
  }, []);

  const getEventsByPlayer = useCallback((playerId: string): GameEvent[] => {
    return exactGameStateService.getEvents({ playerId });
  }, []);

  // Stats functions
  const getPlayerStats = useCallback((playerId: string): PlayerMatchStats | null => {
    return exactGameStateService.getPlayerStats(playerId);
  }, []);

  const getTeamStats = useCallback((team: 'home' | 'away') => {
    return exactGameStateService.getTeamStats(team);
  }, []);

  // Snapshot functions
  const createSnapshot = useCallback((reason: string): GameSnapshot | null => {
    try {
      return exactGameStateService.createSnapshot(reason);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      return null;
    }
  }, []);

  const restoreFromSnapshot = useCallback((index: number): boolean => {
    return exactGameStateService.restoreFromSnapshot(index);
  }, []);

  // Data management functions
  const exportData = useCallback(() => {
    return exactGameStateService.exportGameData();
  }, []);

  const importData = useCallback((data: any): boolean => {
    return exactGameStateService.importGameData(data);
  }, []);

  // Computed values
  const isGameRunning = gameState?.isRunning || false;
  const isPaused = gameState?.isPaused || false;
  const currentTime = gameState?.currentTime || 0;
  const currentHalf = gameState?.currentHalf || 'first';
  const score = gameState?.score || { home: 0, away: 0 };
  const fouls = gameState?.fouls || { home: 0, away: 0 };
  const recentEvents = events.slice(-10).reverse(); // Last 10 events, most recent first

  return {
    // Game State
    gameState,
    isGameRunning,
    isPaused,
    currentTime,
    currentHalf,
    score,
    fouls,
    
    // Events
    events,
    recentEvents,
    
    // Actions
    initializeGame,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    switchHalf,
    updateTime,
    
    // Event Management
    addEvent,
    removeEvent,
    getEventsByType,
    getEventsByPlayer,
    
    // Player Stats
    getPlayerStats,
    getTeamStats,
    
    // Snapshots
    snapshots,
    createSnapshot,
    restoreFromSnapshot,
    
    // Data Management
    exportData,
    importData,
    
    // Utilities
    isInitialized,
    hasUnsavedChanges
  };
};

export default useExactGameState;