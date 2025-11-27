import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { toast } from 'sonner';

// Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  showErrorToast?: boolean;
  retryCount?: number;
  useCache?: boolean;
  cacheKey?: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

interface BatchOperationResult<T> {
  created?: Array<{ index: number; player: T }>;
  updated?: Array<{ id: string; player: T }>;
  errors?: Array<{ index?: number; id?: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Extended interface for internal axios config
interface ExtendedInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  showErrorToast?: boolean;
  retryCount?: number;
  metadata?: {
    requestId: string;
    startTime: number;
  };
}

class PowerfulAPIClient {
  private client: AxiosInstance;
  private cache = new Map<string, CacheEntry>();
  private requestQueue = new Map<string, Promise<any>>();
  private retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff
  private readonly baseURL: string;

  constructor() {
    this.baseURL = import.meta.env?.['VITE_API_URL'] || 'http://localhost:3001';
    
    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For HTTP-only cookies
    });

    this.setupInterceptors();
    this.setupOfflineHandling();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: ExtendedInternalAxiosRequestConfig) => {
        // Add auth token if available and not skipped
        if (!config.skipAuth) {
          const token = this.getAuthToken();
          if (token) {
            if (!config.headers) {
              config.headers = new AxiosHeaders();
            }
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        }

        // Add request ID for tracking
        config.metadata = {
          requestId: Math.random().toString(36).substr(2, 9),
          startTime: Date.now()
        };

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful requests
        const config = response.config as ExtendedInternalAxiosRequestConfig;
        const duration = Date.now() - (config.metadata?.startTime || 0);
        console.log(`✅ API Success: ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`);
        
        return response;
      },
      async (error) => {
        const config = error.config as ExtendedInternalAxiosRequestConfig;
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          await this.handleAuthError();
        } else if (error.response?.status === 429) {
          return this.handleRateLimit(error);
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
          return this.handleNetworkError(error);
        }

        // Show error toast if enabled
        if (config.showErrorToast !== false) {
          this.showErrorToast(error);
        }

        return Promise.reject(error);
      }
    );
  }

  private setupOfflineHandling() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online - retrying pending requests');
      toast.success('Connection restored');
      this.retryPendingRequests();
    });

    window.addEventListener('offline', () => {
      console.log('🔌 Gone offline');
      toast.warning('Connection lost - some features may be limited');
    });
  }

  private getAuthToken(): string | null {
    // Try multiple sources for token
    return (
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token') ||
      this.getCookieValue('accessToken')
    );
  }

  private getCookieValue(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private async handleAuthError() {
    console.log('🔐 Authentication error - attempting refresh');
    
    try {
      await this.refreshToken();
    } catch (refreshError) {
      // Redirect to login if refresh fails
      this.clearAuthData();
      window.location.href = '/signin';
      toast.error('Session expired. Please sign in again.');
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await this.client.post('/auth/refresh', {
      refreshToken
    }, { 
      skipAuth: true,
      showErrorToast: false
    } as RequestConfig);

    if (response.data.success) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', newRefreshToken);
    } else {
      throw new Error('Token refresh failed');
    }
  }

  private clearAuthData() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('statsor_user');
    sessionStorage.clear();
  }

  private async handleRateLimit(error: any): Promise<any> {
    const retryAfter = error.response?.headers['retry-after'] || 60;
    toast.warning(`Rate limit exceeded. Retrying in ${retryAfter} seconds...`);
    
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return this.client.request(error.config);
  }

  private async handleNetworkError(error: any): Promise<any> {
    const config = error.config;
    const retryCount = config.retryCount || 0;
    
    if (retryCount < this.retryDelays.length) {
      const delay = this.retryDelays[retryCount];
      config.retryCount = retryCount + 1;
      
      console.log(`🔄 Retrying request (attempt ${retryCount + 1}) in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.client.request(config);
    }
    
    throw error;
  }

  private showErrorToast(error: any) {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    const status = error.response?.status;
    
    if (status >= 500) {
      toast.error(`Server Error (${status}): ${message}`);
    } else if (status >= 400) {
      toast.error(`Error: ${message}`);
    } else {
      toast.error(`Network Error: ${message}`);
    }
  }

  private retryPendingRequests() {
    // Implementation would retry any cached failed requests
    // This is a placeholder for more complex offline/online handling
  }

  // Cache management
  private getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && entry.timestamp + entry.expiry > Date.now()) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any, expiry: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  // Request deduplication
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // Core request method
  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // Check cache first
      if (config.useCache && config.cacheKey) {
        const cachedData = this.getCachedData(config.cacheKey);
        if (cachedData) {
          console.log(`📦 Cache hit: ${config.cacheKey}`);
          return cachedData;
        }
      }

      // Deduplicate identical requests
      const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`;
      
      const response = await this.deduplicateRequest(requestKey, () => 
        this.client.request<ApiResponse<T>>(config as AxiosRequestConfig)
      );

      const result = response.data;

      // Cache successful responses
      if (config.useCache && config.cacheKey && result.success) {
        this.setCachedData(config.cacheKey, result);
      }

      return result;
    } catch (error: any) {
      console.error('❌ API Error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Request failed',
        code: error.response?.data?.code || 'UNKNOWN_ERROR'
      };
    }
  }

  // =====================================
  // AUTHENTICATION METHODS
  // =====================================

  async register(userData: any): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/auth/register',
      data: userData,
      skipAuth: true
    });
  }

  async login(credentials: any): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
      skipAuth: true
    });
  }

  async googleTokenExchange(code: string): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/auth/google/token',
      data: { code },
      skipAuth: true
    });
  }

  async logout(): Promise<ApiResponse> {
    const result = await this.request({
      method: 'POST',
      url: '/auth/logout'
    });
    
    if (result.success) {
      this.clearAuthData();
      this.cache.clear(); // Clear all cached data on logout
    }
    
    return result;
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: '/auth/me',
      useCache: true,
      cacheKey: 'current-user'
    });
  }

  // =====================================
  // PLAYER METHODS (Enhanced)
  // =====================================

  async getPlayers(filters: any = {}, pagination: any = {}): Promise<ApiResponse> {
    const cacheKey = `players-${JSON.stringify({ filters, pagination })}`;
    
    return this.request({
      method: 'GET',
      url: '/players',
      params: { ...filters, ...pagination },
      useCache: true,
      cacheKey
    });
  }

  async getPlayer(id: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/players/${id}`,
      params: options,
      useCache: true,
      cacheKey: `player-${id}-${JSON.stringify(options)}`
    });
  }

  async createPlayer(playerData: any): Promise<ApiResponse> {
    const result = await this.request({
      method: 'POST',
      url: '/players',
      data: playerData
    });
    
    // Invalidate related caches
    if (result.success) {
      this.invalidateCache('players-');
      toast.success('Player created successfully!');
    }
    
    return result;
  }

  async updatePlayer(id: string, updateData: any): Promise<ApiResponse> {
    const result = await this.request({
      method: 'PUT',
      url: `/players/${id}`,
      data: updateData
    });
    
    if (result.success) {
      this.invalidateCache(`player-${id}`);
      this.invalidateCache('players-');
      toast.success('Player updated successfully!');
    }
    
    return result;
  }

  async deletePlayer(id: string, permanent: boolean = false): Promise<ApiResponse> {
    const result = await this.request({
      method: 'DELETE',
      url: `/players/${id}`,
      params: { permanent }
    });
    
    if (result.success) {
      this.invalidateCache(`player-${id}`);
      this.invalidateCache('players-');
      toast.success('Player deleted successfully!');
    }
    
    return result;
  }

  async getPlayerStatistics(id: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/players/${id}/statistics`,
      params: options,
      useCache: true,
      cacheKey: `player-stats-${id}-${JSON.stringify(options)}`
    });
  }

  async comparePlayers(playerIds: string[], options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/players/compare',
      data: { playerIds, ...options }
    });
  }

  async exportPlayers(options: any = {}): Promise<Blob> {
    const response = await this.client.get('/players/export', {
      params: options,
      responseType: 'blob'
    });
    
    return response.data;
  }

  async batchCreatePlayers(players: any[], teamId: string, options: any = {}): Promise<ApiResponse<BatchOperationResult<any>>> {
    const result = await this.request<BatchOperationResult<any>>({
      method: 'POST',
      url: '/players/batch',
      data: { players, teamId, ...options },
      timeout: 60000 // 1 minute for batch operations
    });
    
    if (result.success || (result.data && typeof result.data === 'object' && 'summary' in result.data && result.data.summary && result.data.summary.successful > 0)) {
      this.invalidateCache('players-');
      this.invalidateCache('analytics-');
      const summary = result.data?.summary;
      if (summary) {
        toast.success(`Batch operation completed: ${summary.successful}/${summary.total} players created`);
      }
    }
    
    return result;
  }

  async batchUpdatePlayers(updates: any[]): Promise<ApiResponse<BatchOperationResult<any>>> {
    const result = await this.request<BatchOperationResult<any>>({
      method: 'PUT',
      url: '/players/batch',
      data: { updates },
      timeout: 60000
    });
    
    if (result.success || (result.data && typeof result.data === 'object' && 'summary' in result.data && result.data.summary && result.data.summary.successful > 0)) {
      this.invalidateCache('players-');
      this.invalidateCache('analytics-');
      const summary = result.data?.summary;
      if (summary) {
        toast.success(`Batch update completed: ${summary.successful}/${summary.total} players updated`);
      }
    }
    
    return result;
  }

  async batchDeletePlayers(playerIds: string[], options: any = {}): Promise<ApiResponse> {
    const result = await this.request({
      method: 'DELETE',
      url: '/players/batch',
      data: { playerIds, ...options },
      timeout: 60000
    });
    
    if (result.success) {
      this.invalidateCache('players-');
      this.invalidateCache('analytics-');
      toast.success(`Successfully deleted ${playerIds.length} players`);
    }
    
    return result;
  }

  // =====================================
  // ADVANCED SEARCH
  // =====================================

  async advancedPlayerSearch(searchCriteria: any): Promise<ApiResponse> {
    const cacheKey = `advanced-search-${JSON.stringify(searchCriteria)}`;
    
    return this.request({
      method: 'POST',
      url: '/players/search',
      data: searchCriteria,
      useCache: true,
      cacheKey,
      timeout: 30000
    });
  }

  async getSearchSuggestions(query: string, type: string = 'players'): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/search/suggestions/${type}`,
      params: { query, limit: 10 },
      useCache: true,
      cacheKey: `suggestions-${type}-${query}`
    });
  }

  async getSearchFacets(type: string = 'players', filters: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/search/facets/${type}`,
      params: filters,
      useCache: true,
      cacheKey: `facets-${type}-${JSON.stringify(filters)}`
    });
  }

  // =====================================
  // FILE OPERATIONS
  // =====================================

  async uploadPlayerFiles(playerId: string, files: File[], options: any = {}): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    return this.uploadFile(`/players/${playerId}/upload`, formData, options.onProgress);
  }

  async downloadPlayerData(playerId: string, format: string = 'json'): Promise<Blob> {
    const response = await this.client.get(`/players/${playerId}/download`, {
      params: { format },
      responseType: 'blob'
    });
    
    return response.data;
  }

  async exportPlayersData(filters: any = {}, format: string = 'csv'): Promise<Blob> {
    const response = await this.client.get('/players/export', {
      params: { ...filters, format },
      responseType: 'blob',
      timeout: 60000 // 1 minute for exports
    });
    
    return response.data;
  }

  async importPlayersData(file: File, options: any = {}): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    return this.uploadFile('/players/import', formData, options.onProgress);
  }

  // =====================================
  // ENHANCED ANALYTICS
  // =====================================

  async getPerformanceTrends(options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: '/analytics/performance-trends',
      params: options,
      useCache: true,
      cacheKey: `performance-trends-${JSON.stringify(options)}`
    });
  }

  async getMatchHeatmap(matchId: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/heatmaps/${matchId}`,
      params: options,
      useCache: true,
      cacheKey: `heatmap-${matchId}-${JSON.stringify(options)}`
    });
  }

  async getPredictiveAnalytics(type: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/predictive/${type}`,
      params: options,
      useCache: true,
      cacheKey: `predictive-${type}-${JSON.stringify(options)}`
    });
  }

  async getCustomReports(options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: '/analytics/reports',
      params: options,
      useCache: true,
      cacheKey: `custom-reports-${JSON.stringify(options)}`
    });
  }

  async getReportData(reportId: string): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/reports/${reportId}`,
      useCache: true,
      cacheKey: `report-data-${reportId}`
    });
  }

  async deleteReport(reportId: string): Promise<ApiResponse> {
    const result = await this.request({
      method: 'DELETE',
      url: `/analytics/reports/${reportId}`
    });
    
    if (result.success) {
      this.invalidateCache('custom-reports-');
      this.invalidateCache(`report-data-${reportId}`);
      toast.success('Report deleted successfully!');
    }
    
    return result;
  }

  // =====================================
  // REAL-TIME ENHANCEMENTS
  // =====================================

  createRealTimeConnection(endpoint: string, options: any = {}): {
    connect: () => EventSource;
    disconnect: () => void;
    isConnected: () => boolean;
  } {
    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;
    const { 
      onData, 
      onError, 
      onConnect, 
      onDisconnect,
      autoReconnect = true,
      reconnectInterval = 5000
    } = options;

    const connect = (): EventSource => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`${this.baseURL}/api/v1/${endpoint}`);
      
      eventSource.onopen = () => {
        console.log(`🔗 Real-time connection established: ${endpoint}`);
        onConnect?.();
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onData?.(data);
        } catch (error) {
          console.error('Failed to parse real-time data:', error);
          onError?.(error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error(`❌ Real-time connection error: ${endpoint}`, error);
        onError?.(error);
        
        if (autoReconnect && !reconnectTimer) {
          reconnectTimer = window.setTimeout(() => {
            console.log(`🔄 Attempting to reconnect: ${endpoint}`);
            connect();
          }, reconnectInterval);
        }
      };
      
      eventSource.addEventListener('close', () => {
        console.log(`🔌 Real-time connection closed: ${endpoint}`);
        onDisconnect?.();
      });

      return eventSource;
    };

    const disconnect = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const isConnected = () => {
      return eventSource?.readyState === EventSource.OPEN;
    };

    return { connect, disconnect, isConnected };
  }

  // =====================================
  // OPTIMISTIC UPDATES
  // =====================================

  async optimisticUpdate<T>(
    optimisticData: T,
    requestFn: () => Promise<ApiResponse<T>>,
    revertFn?: (data: T) => void
  ): Promise<ApiResponse<T>> {
    try {
      // Apply optimistic update immediately
      // This would typically update a state management system
      
      const result = await requestFn();
      
      if (!result.success && revertFn) {
        // Revert optimistic update if request failed
        revertFn(optimisticData);
      }
      
      return result;
    } catch (error: any) {
      if (revertFn) {
        revertFn(optimisticData);
      }
      
      return {
        success: false,
        error: error.message || 'Optimistic update failed',
        code: 'OPTIMISTIC_UPDATE_FAILED'
      };
    }
  }

  // =====================================
  // ADVANCED CACHING
  // =====================================

  async prefetchData(requests: Array<{ key: string; requestFn: () => Promise<any> }>): Promise<void> {
    const promises = requests.map(async ({ key, requestFn }) => {
      try {
        const data = await requestFn();
        this.setCachedData(key, data, 10 * 60 * 1000); // 10 minutes cache
      } catch (error) {
        console.warn(`Failed to prefetch data for key: ${key}`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log(`📦 Prefetched ${requests.length} data entries`);
  }

  getCacheStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; size: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      size: JSON.stringify(entry.data).length
    }));

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits vs misses
      entries
    };
  }

  // =====================================
  // ENHANCED ERROR HANDLING
  // =====================================

  async retryWithBackoff<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // =====================================
  // PERFORMANCE MONITORING
  // =====================================

  getPerformanceMetrics(): {
    averageResponseTime: number;
    totalRequests: number;
    failedRequests: number;
    cacheHitRate: number;
  } {
    // This would be implemented with proper metrics collection
    return {
      averageResponseTime: 0,
      totalRequests: 0,
      failedRequests: 0,
      cacheHitRate: 0
    };
  }

  // =====================================
  // ANALYTICS METHODS
  // =====================================

  async getDashboardAnalytics(filters: any = {}): Promise<ApiResponse> {
    const cacheKey = `dashboard-analytics-${JSON.stringify(filters)}`;
    
    return this.request({
      method: 'GET',
      url: '/analytics/dashboard',
      params: filters,
      useCache: true,
      cacheKey
    });
  }

  async getPlayerAnalytics(id: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/players/${id}`,
      params: options,
      useCache: true,
      cacheKey: `player-analytics-${id}-${JSON.stringify(options)}`
    });
  }

  async getTeamAnalytics(id: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/teams/${id}`,
      params: options,
      useCache: true,
      cacheKey: `team-analytics-${id}-${JSON.stringify(options)}`
    });
  }

  async getMatchAnalytics(id: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/matches/${id}`,
      params: options,
      useCache: true,
      cacheKey: `match-analytics-${id}-${JSON.stringify(options)}`
    });
  }

  async generateCustomReport(reportConfig: any): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/analytics/custom-report',
      data: reportConfig,
      timeout: 60000 // 1 minute for report generation
    });
  }

  async getAutomatedInsights(options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: '/analytics/insights/automated',
      params: options
    });
  }

  // =====================================
  // USER BEHAVIOR ANALYTICS
  // =====================================

  async getUserBehaviorPatterns(userId: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/behavior/${userId}`,
      params: options,
      useCache: true,
      cacheKey: `user-behavior-${userId}-${JSON.stringify(options)}`
    });
  }

  async getUserActivityMetrics(userId: string, timeframe: string = '30d'): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/user-activity/${userId}`,
      params: { timeframe },
      useCache: true,
      cacheKey: `user-activity-${userId}-${timeframe}`
    });
  }

  async getUserEngagementStats(userId: string, options: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/user-engagement/${userId}`,
      params: options,
      useCache: true,
      cacheKey: `user-engagement-${userId}-${JSON.stringify(options)}`
    });
  }

  async getUserInteractionHistory(userId: string, limit: number = 50): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/user-interactions/${userId}`,
      params: { limit },
      useCache: true,
      cacheKey: `user-interactions-${userId}-${limit}`
    });
  }

  async getUserPreferences(userId: string): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: `/analytics/user-preferences/${userId}`,
      useCache: true,
      cacheKey: `user-preferences-${userId}`
    });
  }

  async trackUserAction(userId: string, action: string, metadata: any = {}): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/analytics/track-action',
      data: {
        userId,
        action,
        metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  // =====================================
  // REAL-TIME DATA
  // =====================================

  createRealTimeAnalytics(teamId: string, onData: (data: any) => void, onError?: (error: any) => void): () => void {
    const eventSource = new EventSource(`${this.baseURL}/api/v1/analytics/real-time/${teamId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onData(data);
      } catch (error) {
        console.error('Failed to parse real-time data:', error);
        onError?.(error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('Real-time connection error:', error);
      onError?.(error);
    };
    
    return () => eventSource.close();
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  invalidateCache(prefix: string = '') {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries with prefix '${prefix}'`);
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  getHealthStatus(): Promise<ApiResponse> {
    return this.request({
      method: 'GET',
      url: '/health',
      skipAuth: true,
      showErrorToast: false
    });
  }

  // File upload helper
  async uploadFile(url: string, file: File | FormData, onProgress?: (progress: number) => void): Promise<ApiResponse> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    return new Promise((resolve, reject) => {
      this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      })
      .then(response => resolve(response.data))
      .catch(reject);
    });
  }
}

// Create and export singleton instance
const powerfulAPI = new PowerfulAPIClient();
export default powerfulAPI;

// Export types for use in components
export type { ApiResponse, RequestConfig };