/**
 * Exact Game State Service
 * Enhanced game state tracking and management system
 * Provides comprehensive match state, events, and analytics
 */

export interface GameEvent {
  id: string;
  timestamp: number;
  minute: number;
  second: number;
  type: 'goal' | 'assist' | 'foul' | 'card' | 'substitution' | 'shot' | 'save' | 'pass' | 'tackle' | 'interception' | 'custom';
  playerId: string;
  playerName: string;
  teamId: 'home' | 'away';
  position: { x: number; y: number } | null;
  metadata: Record<string, any>;
  half: 'first' | 'second' | 'overtime';
  zone?: number;
  origin?: string;
  location?: string;
}

export interface GameState {
  matchId: string;
  startTime: number | null;
  currentTime: number;
  isRunning: boolean;
  isPaused: boolean;
  currentHalf: 'first' | 'second' | 'overtime';
  score: {
    home: number;
    away: number;
  };
  fouls: {
    home: number;
    away: number;
  };
  cards: {
    home: { yellow: number; red: number };
    away: { yellow: number; red: number };
  };
  events: GameEvent[];
  players: {
    home: GamePlayer[];
    away: GamePlayer[];
  };
  formations: {
    home: string;
    away: string;
  };
  possession: {
    home: number;
    away: number;
  };
  statistics: GameStatistics;
}

export interface GamePlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  isOnField: boolean;
  isActive: boolean;
  stats: PlayerMatchStats;
}

export interface PlayerMatchStats {
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passesCompleted: number;
  fouls: number;
  foulsReceived: number;
  tackles: number;
  interceptions: number;
  saves: number;
  minutesPlayed: number;
  cards: { yellow: number; red: number };
}

export interface GameStatistics {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  passes: { home: number; away: number };
  passAccuracy: { home: number; away: number };
  tackles: { home: number; away: number };
  interceptions: { home: number; away: number };
}

export interface GameSnapshot {
  timestamp: number;
  minute: number;
  state: GameState;
  events: GameEvent[];
  hash: string;
}

class ExactGameStateService {
  private gameState: GameState | null = null;
  private snapshots: GameSnapshot[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private storageKey = 'exactGameState';

  constructor() {
    this.loadFromStorage();
    this.startAutoSave();
  }

  /**
   * Initialize a new game state
   */
  initializeGame(matchId: string, homePlayers: GamePlayer[], awayPlayers: GamePlayer[]): GameState {
    this.gameState = {
      matchId,
      startTime: null,
      currentTime: 0,
      isRunning: false,
      isPaused: false,
      currentHalf: 'first',
      score: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      cards: {
        home: { yellow: 0, red: 0 },
        away: { yellow: 0, red: 0 }
      },
      events: [],
      players: {
        home: homePlayers.map(p => ({ ...p, stats: this.initializePlayerStats() })),
        away: awayPlayers.map(p => ({ ...p, stats: this.initializePlayerStats() }))
      },
      formations: { home: '4-3-3', away: '4-3-3' },
      possession: { home: 50, away: 50 },
      statistics: this.initializeStatistics()
    };

    this.createSnapshot('game_initialized');
    this.saveToStorage();
    this.emit('gameInitialized', this.gameState);
    
    return this.gameState;
  }

  /**
   * Start the game timer
   */
  startGame(): void {
    if (!this.gameState) throw new Error('Game not initialized');
    
    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    this.gameState.startTime = this.gameState.startTime || Date.now();
    
    this.createSnapshot('game_started');
    this.emit('gameStarted', this.gameState);
    this.saveToStorage();
  }

  /**
   * Pause the game timer
   */
  pauseGame(): void {
    if (!this.gameState) throw new Error('Game not initialized');
    
    this.gameState.isRunning = false;
    this.gameState.isPaused = true;
    
    this.createSnapshot('game_paused');
    this.emit('gamePaused', this.gameState);
    this.saveToStorage();
  }

  /**
   * Resume the game timer
   */
  resumeGame(): void {
    if (!this.gameState) throw new Error('Game not initialized');
    
    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    
    this.createSnapshot('game_resumed');
    this.emit('gameResumed', this.gameState);
    this.saveToStorage();
  }

  /**
   * Update game time
   */
  updateTime(seconds: number): void {
    if (!this.gameState) return;
    
    this.gameState.currentTime = seconds;
    this.emit('timeUpdated', { time: seconds, state: this.gameState });
  }

  /**
   * Switch to next half
   */
  switchHalf(): void {
    if (!this.gameState) throw new Error('Game not initialized');
    
    if (this.gameState.currentHalf === 'first') {
      this.gameState.currentHalf = 'second';
    } else if (this.gameState.currentHalf === 'second') {
      this.gameState.currentHalf = 'overtime';
    }
    
    this.createSnapshot('half_switched');
    this.emit('halfSwitched', this.gameState);
    this.saveToStorage();
  }

  /**
   * Add a game event
   */
  addEvent(event: Omit<GameEvent, 'id' | 'timestamp'>): GameEvent {
    if (!this.gameState) throw new Error('Game not initialized');
    
    const gameEvent: GameEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now()
    };
    
    this.gameState.events.push(gameEvent);
    this.updateStatistics(gameEvent);
    this.updatePlayerStats(gameEvent);
    
    this.createSnapshot('event_added');
    this.emit('eventAdded', gameEvent);
    this.saveToStorage();
    
    return gameEvent;
  }

  /**
   * Remove an event
   */
  removeEvent(eventId: string): boolean {
    if (!this.gameState) return false;
    
    const eventIndex = this.gameState.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return false;
    
    const removedEvent = this.gameState.events.splice(eventIndex, 1)[0];
    if (!removedEvent) return false;
    
    this.revertStatistics(removedEvent);
    this.revertPlayerStats(removedEvent);
    
    this.createSnapshot('event_removed');
    this.emit('eventRemoved', removedEvent);
    this.saveToStorage();
    
    return true;
  }

  /**
   * Get current game state
   */
  getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * Get game events filtered by criteria
   */
  getEvents(filter?: Partial<GameEvent>): GameEvent[] {
    if (!this.gameState) return [];
    
    let events = this.gameState.events;
    
    if (filter) {
      events = events.filter(event => {
        return Object.entries(filter).every(([key, value]) => {
          return event[key as keyof GameEvent] === value;
        });
      });
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get player statistics
   */
  getPlayerStats(playerId: string): PlayerMatchStats | null {
    if (!this.gameState) return null;
    
    const homePlayer = this.gameState.players.home.find(p => p.id === playerId);
    const awayPlayer = this.gameState.players.away.find(p => p.id === playerId);
    
    return homePlayer?.stats || awayPlayer?.stats || null;
  }

  /**
   * Get team statistics
   */
  getTeamStats(team: 'home' | 'away'): any {
    if (!this.gameState) return null;
    
    const players = this.gameState.players[team];
    const teamStats = {
      goals: players.reduce((sum, p) => sum + p.stats.goals, 0),
      assists: players.reduce((sum, p) => sum + p.stats.assists, 0),
      shots: players.reduce((sum, p) => sum + p.stats.shots, 0),
      passes: players.reduce((sum, p) => sum + p.stats.passes, 0),
      fouls: players.reduce((sum, p) => sum + p.stats.fouls, 0),
      cards: {
        yellow: players.reduce((sum, p) => sum + p.stats.cards.yellow, 0),
        red: players.reduce((sum, p) => sum + p.stats.cards.red, 0)
      }
    };
    
    return teamStats;
  }

  /**
   * Create a game state snapshot
   */
  createSnapshot(reason: string): GameSnapshot {
    if (!this.gameState) throw new Error('Game not initialized');
    
    const snapshot: GameSnapshot = {
      timestamp: Date.now(),
      minute: Math.floor(this.gameState.currentTime / 60),
      state: JSON.parse(JSON.stringify(this.gameState)),
      events: [...this.gameState.events],
      hash: this.generateHash(this.gameState)
    };
    
    this.snapshots.push(snapshot);
    
    // Keep only last 50 snapshots
    if (this.snapshots.length > 50) {
      this.snapshots = this.snapshots.slice(-50);
    }
    
    this.emit('snapshotCreated', { snapshot, reason });
    return snapshot;
  }

  /**
   * Restore from snapshot
   */
  restoreFromSnapshot(snapshotIndex: number): boolean {
    if (snapshotIndex < 0 || snapshotIndex >= this.snapshots.length) {
      return false;
    }
    
    const snapshot = this.snapshots[snapshotIndex];
    if (!snapshot) {
      return false;
    }
    this.gameState = JSON.parse(JSON.stringify(snapshot.state));
    
    this.emit('stateRestored', { snapshot, gameState: this.gameState });
    this.saveToStorage();
    
    return true;
  }

  /**
   * Export game data
   */
  exportGameData(): any {
    return {
      gameState: this.gameState,
      snapshots: this.snapshots,
      exportedAt: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Import game data
   */
  importGameData(data: any): boolean {
    try {
      if (data.gameState) {
        this.gameState = data.gameState;
      }
      if (data.snapshots) {
        this.snapshots = data.snapshots;
      }
      
      this.saveToStorage();
      this.emit('dataImported', data);
      
      return true;
    } catch (error) {
      console.error('Failed to import game data:', error);
      return false;
    }
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private initializePlayerStats(): PlayerMatchStats {
    return {
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
    };
  }

  private initializeStatistics(): GameStatistics {
    return {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      passes: { home: 0, away: 0 },
      passAccuracy: { home: 0, away: 0 },
      tackles: { home: 0, away: 0 },
      interceptions: { home: 0, away: 0 }
    };
  }

  private updateStatistics(event: GameEvent): void {
    if (!this.gameState) return;
    
    const team = event.teamId;
    const stats = this.gameState.statistics;
    
    switch (event.type) {
      case 'goal':
        this.gameState.score[team]++;
        break;
      case 'shot':
        stats.shots[team]++;
        if (event.metadata?.['onTarget']) {
          stats.shotsOnTarget[team]++;
        }
        break;
      case 'foul':
        stats.fouls[team]++;
        this.gameState.fouls[team]++;
        break;
      case 'pass':
        stats.passes[team]++;
        if (event.metadata?.['completed']) {
          // Update pass accuracy
          const totalPasses = stats.passes[team];
          const completedPasses = event.metadata['completed'] ? 1 : 0;
          stats.passAccuracy[team] = (stats.passAccuracy[team] * (totalPasses - 1) + completedPasses * 100) / totalPasses;
        }
        break;
      case 'tackle':
        stats.tackles[team]++;
        break;
      case 'interception':
        stats.interceptions[team]++;
        break;
    }
  }

  private revertStatistics(event: GameEvent): void {
    if (!this.gameState) return;
    
    const team = event.teamId;
    const stats = this.gameState.statistics;
    
    switch (event.type) {
      case 'goal':
        this.gameState.score[team] = Math.max(0, this.gameState.score[team] - 1);
        break;
      case 'shot':
        stats.shots[team] = Math.max(0, stats.shots[team] - 1);
        if (event.metadata?.['onTarget']) {
          stats.shotsOnTarget[team] = Math.max(0, stats.shotsOnTarget[team] - 1);
        }
        break;
      case 'foul':
        stats.fouls[team] = Math.max(0, stats.fouls[team] - 1);
        this.gameState.fouls[team] = Math.max(0, this.gameState.fouls[team] - 1);
        break;
    }
  }

  private updatePlayerStats(event: GameEvent): void {
    if (!this.gameState) return;
    
    const player = this.findPlayer(event.playerId);
    if (!player) return;
    
    switch (event.type) {
      case 'goal':
        player.stats.goals++;
        break;
      case 'assist':
        player.stats.assists++;
        break;
      case 'shot':
        player.stats.shots++;
        if (event.metadata?.['onTarget']) {
          player.stats.shotsOnTarget++;
        }
        break;
      case 'pass':
        player.stats.passes++;
        if (event.metadata?.['completed']) {
          player.stats.passesCompleted++;
        }
        break;
      case 'foul':
        player.stats.fouls++;
        break;
      case 'tackle':
        player.stats.tackles++;
        break;
      case 'interception':
        player.stats.interceptions++;
        break;
      case 'save':
        player.stats.saves++;
        break;
      case 'card':
        if (event.metadata?.['cardType'] === 'yellow') {
          player.stats.cards.yellow++;
        } else if (event.metadata?.['cardType'] === 'red') {
          player.stats.cards.red++;
        }
        break;
    }
  }

  private revertPlayerStats(event: GameEvent): void {
    if (!this.gameState) return;
    
    const player = this.findPlayer(event.playerId);
    if (!player) return;
    
    switch (event.type) {
      case 'goal':
        player.stats.goals = Math.max(0, player.stats.goals - 1);
        break;
      case 'assist':
        player.stats.assists = Math.max(0, player.stats.assists - 1);
        break;
      case 'shot':
        player.stats.shots = Math.max(0, player.stats.shots - 1);
        if (event.metadata?.['onTarget']) {
          player.stats.shotsOnTarget = Math.max(0, player.stats.shotsOnTarget - 1);
        }
        break;
    }
  }

  private findPlayer(playerId: string): GamePlayer | null {
    if (!this.gameState) return null;
    
    return this.gameState.players.home.find(p => p.id === playerId) ||
           this.gameState.players.away.find(p => p.id === playerId) ||
           null;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHash(state: GameState): string {
    const stateString = JSON.stringify(state);
    let hash = 0;
    for (let i = 0; i < stateString.length; i++) {
      const char = stateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private saveToStorage(): void {
    try {
      const data = {
        gameState: this.gameState,
        snapshots: this.snapshots.slice(-10), // Keep only last 10 snapshots in storage
        savedAt: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save game state to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.gameState = parsed.gameState;
        this.snapshots = parsed.snapshots || [];
      }
    } catch (error) {
      console.error('Failed to load game state from storage:', error);
    }
  }

  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      if (this.gameState && this.gameState.isRunning) {
        this.saveToStorage();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  public destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const exactGameStateService = new ExactGameStateService();
export default exactGameStateService;