// Real-time enhancements utilities for TeamPlaymate platform

import { queryCacheService } from './database';

// Types for real-time data
interface LiveMatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'card' | 'substitution' | 'foul' | 'corner' | 'offside';
  timestamp: number;
  playerId?: string;
  teamId: string;
  data: Record<string, any>;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id: string;
}

interface OfflineQueueItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

// WebSocket Connection Manager
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';

  constructor(private url: string) {
    this.connect();
  }

  /**
   * Establish WebSocket connection with automatic reconnection
   */
  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.connectionState = 'connecting';
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.processMessageQueue();
        this.notifySubscribers('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.connectionState = 'disconnected';
        this.stopHeartbeat();
        this.notifySubscribers('connection', { status: 'disconnected' });
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionState = 'error';
        this.notifySubscribers('connection', { status: 'error', error });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', payload: {}, timestamp: Date.now(), id: this.generateId() });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'pong':
        // Heartbeat response
        break;
      case 'match_event':
        this.notifySubscribers('match_events', message.payload);
        break;
      case 'live_stats':
        this.notifySubscribers('live_stats', message.payload);
        break;
      case 'team_update':
        this.notifySubscribers('team_updates', message.payload);
        break;
      default:
        this.notifySubscribers(message.type, message.payload);
    }
  }

  /**
   * Send message through WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later sending
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages when connection is restored
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  /**
   * Notify all subscribers of an event
   */
  private notifySubscribers(eventType: string, data: any): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket subscriber:', error);
        }
      });
    }
  }

  /**
   * Join a match room for live updates
   */
  joinMatch(matchId: string): void {
    this.send({
      type: 'join_match',
      payload: { matchId },
      timestamp: Date.now(),
      id: this.generateId()
    });
  }

  /**
   * Leave a match room
   */
  leaveMatch(matchId: string): void {
    this.send({
      type: 'leave_match',
      payload: { matchId },
      timestamp: Date.now(),
      id: this.generateId()
    });
  }

  /**
   * Get current connection state
   */
  getConnectionState(): string {
    return this.connectionState;
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Service Worker Manager for Offline Functionality
export class ServiceWorkerManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.init();
    this.setupOnlineOfflineListeners();
  }

  /**
   * Initialize service worker
   */
  private async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));
        
        // Check for updates
        this.swRegistration.addEventListener('updatefound', () => {
          console.log('Service Worker update found');
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      console.log('App is online');
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.isOnline = false;
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleSWMessage(event: MessageEvent): void {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload);
        break;
      case 'OFFLINE_FALLBACK':
        console.log('Serving offline fallback:', payload);
        break;
    }
  }

  /**
   * Cache critical resources
   */
  async cacheResources(resources: string[]): Promise<void> {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({
        type: 'CACHE_RESOURCES',
        payload: { resources }
      });
    }
  }

  /**
   * Add action to offline queue
   */
  addToOfflineQueue(action: string, data: any): void {
    const queueItem: OfflineQueueItem = {
      id: this.generateId(),
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const item of queue) {
      try {
        await this.executeQueuedAction(item);
        console.log('Processed offline action:', item.action);
      } catch (error) {
        console.error('Failed to process offline action:', error);
        
        // Retry logic
        if (item.retryCount < 3) {
          item.retryCount++;
          this.offlineQueue.push(item);
        }
      }
    }
    
    this.saveOfflineQueue();
  }

  /**
   * Execute a queued action
   */
  private async executeQueuedAction(item: OfflineQueueItem): Promise<void> {
    switch (item.action) {
      case 'sync_data':
        await this.syncData(item.data);
        break;
      case 'upload_file':
        await this.uploadFile(item.data);
        break;
      case 'update_profile':
        await this.updateProfile(item.data);
        break;
      default:
        console.warn('Unknown offline action:', item.action);
    }
  }

  /**
   * Sync data when back online
   */
  private async syncData(data: any): Promise<void> {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Sync failed');
    }
  }

  /**
   * Upload file when back online
   */
  private async uploadFile(data: any): Promise<void> {
    const formData = new FormData();
    formData.append('file', data.file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
  }

  /**
   * Update profile when back online
   */
  private async updateProfile(data: any): Promise<void> {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Profile update failed');
    }
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('offlineQueue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Check if app is online
   */
  isAppOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): { count: number; items: OfflineQueueItem[] } {
    return {
      count: this.offlineQueue.length,
      items: [...this.offlineQueue]
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Progressive Loading Manager
export class ProgressiveLoadingManager {
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private observers: Map<string, IntersectionObserver> = new Map();

  /**
   * Load data progressively with caching
   */
  async loadProgressively<T>(
    key: string,
    loader: () => Promise<T>,
    options: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      retries?: number;
    } = {}
  ): Promise<T> {
    const { ttl = 300000, priority = 'medium', retries = 3 } = options;
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Check if already loading
    if (this.loadingQueue.has(key)) {
      return this.loadingQueue.get(key)!;
    }

    // Start loading
    const loadPromise = this.executeWithRetry(loader, retries);
    this.loadingQueue.set(key, loadPromise);

    try {
      const data = await loadPromise;
      
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
      
      return data;
    } finally {
      this.loadingQueue.delete(key);
    }
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number,
    delay = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  /**
   * Preload critical resources
   */
  async preloadCritical(resources: Array<{
    key: string;
    loader: () => Promise<any>;
    priority: number;
  }>): Promise<void> {
    // Sort by priority
    const sortedResources = resources.sort((a, b) => b.priority - a.priority);
    
    // Load high priority resources first
    const highPriority = sortedResources.filter(r => r.priority >= 8);
    await Promise.all(
      highPriority.map(resource => 
        this.loadProgressively(resource.key, resource.loader, { priority: 'high' })
      )
    );
    
    // Load medium priority resources
    const mediumPriority = sortedResources.filter(r => r.priority >= 5 && r.priority < 8);
    await Promise.all(
      mediumPriority.map(resource => 
        this.loadProgressively(resource.key, resource.loader, { priority: 'medium' })
      )
    );
    
    // Load low priority resources in background
    const lowPriority = sortedResources.filter(r => r.priority < 5);
    lowPriority.forEach(resource => {
      // Don't await these
      this.loadProgressively(resource.key, resource.loader, { priority: 'low' });
    });
  }

  /**
   * Setup lazy loading with Intersection Observer
   */
  setupLazyLoading(
    selector: string,
    loader: (element: Element) => Promise<void>,
    options: IntersectionObserverInit = {}
  ): void {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    const observer = new IntersectionObserver(async (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          try {
            await loader(entry.target);
            observer.unobserve(entry.target);
          } catch (error) {
            console.error('Lazy loading failed:', error);
          }
        }
      }
    }, defaultOptions);

    // Observe existing elements
    document.querySelectorAll(selector).forEach(element => {
      observer.observe(element);
    });

    // Store observer for cleanup
    this.observers.set(selector, observer);
  }

  /**
   * Load match data progressively
   */
  async loadMatchData(matchId: string): Promise<{
    basic: any;
    stats: any;
    events: any;
    analytics: any;
  }> {
    const cacheKey = `match_${matchId}`;
    
    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        // Load basic match info first (highest priority)
        const basic = await this.loadProgressively(
          `match_basic_${matchId}`,
          () => fetch(`/api/matches/${matchId}/basic`).then(r => r.json()),
          { priority: 'high', ttl: 60000 }
        );

        // Load stats and events in parallel (medium priority)
        const [stats, events] = await Promise.all([
          this.loadProgressively(
            `match_stats_${matchId}`,
            () => fetch(`/api/matches/${matchId}/stats`).then(r => r.json()),
            { priority: 'medium', ttl: 120000 }
          ),
          this.loadProgressively(
            `match_events_${matchId}`,
            () => fetch(`/api/matches/${matchId}/events`).then(r => r.json()),
            { priority: 'medium', ttl: 180000 }
          )
        ]);

        // Load analytics in background (low priority)
        const analytics = await this.loadProgressively(
          `match_analytics_${matchId}`,
          () => fetch(`/api/matches/${matchId}/analytics`).then(r => r.json()),
          { priority: 'low', ttl: 300000 }
        );

        return { basic, stats, events, analytics };
      },
      300 // 5 minutes cache
    );
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    items: Array<{ key: string; age: number; size: number }>;
  } {
    const items = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      size: JSON.stringify(value.data).length
    }));

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      items
    };
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Real-time Data Synchronizer
export class RealTimeDataSync {
  private wsManager: WebSocketManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTimestamp = 0;

  constructor(wsUrl: string) {
    this.wsManager = new WebSocketManager(wsUrl);
    this.setupSyncInterval();
  }

  /**
   * Setup periodic data synchronization
   */
  private setupSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      this.syncPendingChanges();
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Sync pending changes
   */
  private async syncPendingChanges(): Promise<void> {
    try {
      const response = await fetch('/api/sync/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastSync: this.lastSyncTimestamp })
      });
      
      if (response.ok) {
        const changes = await response.json();
        this.applyChanges(changes);
        this.lastSyncTimestamp = Date.now();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  /**
   * Apply synchronized changes
   */
  private applyChanges(changes: any[]): void {
    changes.forEach(change => {
      // Emit change events for components to react
      window.dispatchEvent(new CustomEvent('dataSync', {
        detail: change
      }));
    });
  }

  /**
   * Subscribe to live match updates
   */
  subscribeToMatch(matchId: string, callback: (event: LiveMatchEvent) => void): () => void {
    this.wsManager.joinMatch(matchId);
    return this.wsManager.subscribe('match_events', callback);
  }

  /**
   * Get WebSocket connection state
   */
  getConnectionState(): string {
    return this.wsManager.getConnectionState();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.wsManager.disconnect();
  }
}

// Export service instances
export const webSocketManager = new WebSocketManager(
  process.env.REACT_APP_WS_URL || 'ws://localhost:3001'
);
export const serviceWorkerManager = new ServiceWorkerManager();
export const progressiveLoadingManager = new ProgressiveLoadingManager();
export const realTimeDataSync = new RealTimeDataSync(
  process.env.REACT_APP_WS_URL || 'ws://localhost:3001'
);

// Real-time service orchestrator
export class RealTimeService {
  constructor(
    private wsManager = webSocketManager,
    private swManager = serviceWorkerManager,
    private loadingManager = progressiveLoadingManager,
    private dataSync = realTimeDataSync
  ) {}

  /**
   * Initialize all real-time services
   */
  async initialize(): Promise<void> {
    // Cache critical resources
    await this.swManager.cacheResources([
      '/',
      '/static/js/bundle.js',
      '/static/css/main.css',
      '/api/user/profile'
    ]);

    // Setup lazy loading for images
    this.loadingManager.setupLazyLoading(
      'img[data-lazy]',
      async (img) => {
        const src = img.getAttribute('data-lazy');
        if (src) {
          img.setAttribute('src', src);
          img.removeAttribute('data-lazy');
        }
      }
    );
  }

  /**
   * Get comprehensive real-time status
   */
  getStatus(): {
    websocket: string;
    offline: boolean;
    cacheStats: any;
    queueStatus: any;
  } {
    return {
      websocket: this.wsManager.getConnectionState(),
      offline: !this.swManager.isAppOnline(),
      cacheStats: this.loadingManager.getCacheStats(),
      queueStatus: this.swManager.getOfflineQueueStatus()
    };
  }
}

export const realTimeService = new RealTimeService();