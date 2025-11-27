import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import powerfulAPI, { ApiResponse } from '../lib/powerfulAPI';

// Types
interface UseAPIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  retry: () => void;
  refresh: () => Promise<void>;
}

interface UseAPIOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  initialData?: any;
  retryCount?: number;
  retryDelay?: number;
}

interface UseMutationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (variables?: any) => Promise<ApiResponse<T>>;
  reset: () => void;
}

interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: string, variables: V) => void;
  onSettled?: (data: T | null, error: string | null, variables: V) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  optimisticUpdate?: (variables: V) => any;
  revertOptimistic?: () => void;
}

interface UseInfiniteAPIState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  totalCount: number;
}

interface UseRealTimeOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

// =====================================
// CORE HOOKS
// =====================================

/**
 * Core hook for API requests with automatic caching, error handling, and retries
 */
export function usePowerfulAPI<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  deps: any[] = [],
  options: UseAPIOptions = {}
): UseAPIState<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    onSuccess,
    onError,
    initialData = null,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const retryAttempts = useRef(0);
  const isMounted = useRef(true);
  const intervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeQuery = useCallback(async (isRetry = false) => {
    if (!enabled || (!isRetry && loading)) return;

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    if (!isRetry) {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await queryFn();
      
      if (!isMounted.current) return;

      if (result.success) {
        setData(result.data || null);
        setError(null);
        setLastUpdated(new Date());
        retryAttempts.current = 0;
        onSuccess?.(result.data);
      } else {
        throw new Error(result.error || 'Request failed');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      if (!isMounted.current) return;

      const errorMessage = err.message || 'An error occurred';
      
      // Retry logic
      if (retryAttempts.current < retryCount) {
        retryAttempts.current++;
        setTimeout(() => {
          if (isMounted.current) {
            executeQuery(true);
          }
        }, retryDelay * retryAttempts.current);
        return;
      }

      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      if (!isRetry && isMounted.current) {
        setLoading(false);
      }
    }
  }, [enabled, loading, queryFn, onSuccess, onError, retryCount, retryDelay]);

  const retry = useCallback(() => {
    retryAttempts.current = 0;
    executeQuery();
  }, [executeQuery]);

  const refresh = useCallback(async () => {
    await executeQuery();
  }, [executeQuery]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      executeQuery();
    }
  }, [...deps, enabled]);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          executeQuery();
        }
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, executeQuery]);

  // Window focus refetch
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => {
        if (lastUpdated && Date.now() - lastUpdated.getTime() > staleTime) {
          executeQuery();
        }
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnWindowFocus, enabled, lastUpdated, staleTime, executeQuery]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    retry,
    refresh
  };
}

/**
 * Hook for mutations (POST, PUT, DELETE) with optimistic updates and rollback
 */
export function usePowerfulMutation<T, V = any>(
  mutationFn: (variables: V) => Promise<ApiResponse<T>>,
  options: UseMutationOptions<T, V> = {}
): UseMutationState<T> {
  const {
    onSuccess,
    onError,
    onSettled,
    showSuccessToast = true,
    showErrorToast = true,
    optimisticUpdate,
    revertOptimistic
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isMounted = useRef(true);

  const mutate = useCallback(async (variables?: V): Promise<ApiResponse<T>> => {
    if (loading) {
      return { success: false, error: 'Mutation already in progress' };
    }

    setLoading(true);
    setError(null);

    let optimisticData: any = null;

    try {
      // Apply optimistic update
      if (optimisticUpdate && variables) {
        optimisticData = optimisticUpdate(variables);
      }

      const result = await mutationFn(variables as V);

      if (!isMounted.current) return result;

      if (result.success) {
        setData(result.data || null);
        setError(null);
        
        if (showSuccessToast && result.message) {
          toast.success(result.message);
        }
        
        onSuccess?.(result.data as T, variables as V);
      } else {
        const errorMessage = result.error || 'Mutation failed';
        setError(errorMessage);
        
        if (showErrorToast) {
          toast.error(errorMessage);
        }
        
        // Revert optimistic update
        if (optimisticData && revertOptimistic) {
          revertOptimistic();
        }
        
        onError?.(errorMessage, variables as V);
      }

      onSettled?.(result.success ? (result.data as T) : null, result.success ? null : result.error || 'Unknown error', variables as V);
      
      return result;
    } catch (err: any) {
      if (!isMounted.current) {
        return { success: false, error: 'Component unmounted' };
      }

      const errorMessage = err.message || 'Mutation failed';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }

      // Revert optimistic update
      if (optimisticData && revertOptimistic) {
        revertOptimistic();
      }

      onError?.(errorMessage, variables as V);
      onSettled?.(null, errorMessage, variables as V);
      
      return { success: false, error: errorMessage };
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loading, mutationFn, onSuccess, onError, onSettled, showSuccessToast, showErrorToast, optimisticUpdate, revertOptimistic]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
    reset
  };
}

/**
 * Hook for real-time data with automatic connection management
 */
export function useRealTimeData<T>(
  endpoint: string,
  options: UseRealTimeOptions = {}
): {
  data: T | null;
  connected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
} {
  const {
    enabled = true,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const connectionRef = useRef<ReturnType<typeof powerfulAPI.createRealTimeConnection> | null>(null);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
    }

    connectionRef.current = powerfulAPI.createRealTimeConnection(endpoint, {
      onData: (newData: T) => {
        if (isMounted.current) {
          setData(newData);
          setError(null);
        }
      },
      onConnect: () => {
        if (isMounted.current) {
          setConnected(true);
          setError(null);
          onConnect?.();
        }
      },
      onDisconnect: () => {
        if (isMounted.current) {
          setConnected(false);
          onDisconnect?.();
        }
      },
      onError: (err: any) => {
        if (isMounted.current) {
          const errorMessage = err.message || 'Connection error';
          setError(errorMessage);
          onError?.(err);
        }
      },
      autoReconnect,
      reconnectInterval
    });

    connectionRef.current.connect();
  }, [endpoint, onConnect, onDisconnect, onError, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }
    if (isMounted.current) {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    data,
    connected,
    error,
    connect,
    disconnect
  };
}

/**
 * Hook for infinite scrolling/pagination with automatic loading
 */
export function useInfiniteAPI<T>(
  queryFn: (page: number, limit: number) => Promise<ApiResponse<{data: T[]; hasMore: boolean; total?: number}>>,
  limit: number = 20,
  options: UseAPIOptions = {}
): UseInfiniteAPIState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const isMounted = useRef(true);
  const { enabled = true, onSuccess, onError } = options;

  const loadPage = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;

    setLoading(true);
    if (reset) {
      setError(null);
    }

    try {
      const result = await queryFn(pageNum, limit);
      
      if (!isMounted.current) return;

      if (result.success && result.data) {
        const newData = result.data.data || [];
        const hasMoreData = result.data.hasMore ?? newData.length === limit;
        const total = result.data.total || 0;

        setData(prev => reset ? newData : [...prev, ...newData]);
        setHasMore(hasMoreData);
        setTotalCount(total);
        setError(null);
        
        onSuccess?.(result.data);
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err: any) {
      if (!isMounted.current) return;

      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loading, queryFn, limit, onSuccess, onError]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => {
        const nextPage = prev + 1;
        loadPage(nextPage);
        return nextPage;
      });
    }
  }, [hasMore, loading, loadPage]);

  const refresh = useCallback(async () => {
    setPage(1);
    await loadPage(1, true);
  }, [loadPage]);

  useEffect(() => {
    if (enabled) {
      loadPage(1, true);
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount
  };
}

// =====================================
// SPECIALIZED HOOKS
// =====================================

/**
 * Hook for player data management
 */
export function usePlayers(filters: any = {}, pagination: any = {}) {
  return usePowerfulAPI(
    () => powerfulAPI.getPlayers(filters, pagination),
    [JSON.stringify(filters), JSON.stringify(pagination)],
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: true
    }
  );
}

/**
 * Hook for single player data
 */
export function usePlayer(id: string, options: any = {}) {
  return usePowerfulAPI(
    () => powerfulAPI.getPlayer(id, options),
    [id, JSON.stringify(options)],
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );
}

/**
 * Hook for player mutations
 */
export function usePlayerMutation() {
  return {
    create: usePowerfulMutation(
      (playerData: any) => powerfulAPI.createPlayer(playerData),
      {
        showSuccessToast: true,
        showErrorToast: true
      }
    ),
    update: usePowerfulMutation(
      ({ id, data }: { id: string; data: any }) => powerfulAPI.updatePlayer(id, data),
      {
        showSuccessToast: true,
        showErrorToast: true
      }
    ),
    delete: usePowerfulMutation(
      ({ id, permanent }: { id: string; permanent?: boolean }) => powerfulAPI.deletePlayer(id, permanent),
      {
        showSuccessToast: true,
        showErrorToast: true
      }
    ),
    batchCreate: usePowerfulMutation(
      ({ players, teamId, options }: { players: any[]; teamId: string; options?: any }) => 
        powerfulAPI.batchCreatePlayers(players, teamId, options),
      {
        showSuccessToast: true,
        showErrorToast: true
      }
    ),
    batchUpdate: usePowerfulMutation(
      (updates: any[]) => powerfulAPI.batchUpdatePlayers(updates),
      {
        showSuccessToast: true,
        showErrorToast: true
      }
    )
  };
}

/**
 * Hook for dashboard analytics
 */
export function useDashboardAnalytics(filters: any = {}) {
  return usePowerfulAPI(
    () => powerfulAPI.getDashboardAnalytics(filters),
    [JSON.stringify(filters)],
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true
    }
  );
}

/**
 * Hook for player analytics
 */
export function usePlayerAnalytics(playerId: string, options: any = {}) {
  return usePowerfulAPI(
    () => powerfulAPI.getPlayerAnalytics(playerId, options),
    [playerId, JSON.stringify(options)],
    {
      enabled: !!playerId,
      staleTime: 2 * 60 * 1000 // 2 minutes
    }
  );
}

/**
 * Hook for advanced player search
 */
export function usePlayerSearch() {
  return usePowerfulMutation(
    (searchCriteria: any) => powerfulAPI.advancedPlayerSearch(searchCriteria),
    {
      showErrorToast: true
    }
  );
}

/**
 * Hook for real-time analytics
 */
export function useRealTimeAnalytics(teamId: string, enabled: boolean = true) {
  return useRealTimeData<any>(
    `analytics/real-time/${teamId}`,
    {
      enabled: enabled && !!teamId,
      onConnect: () => console.log('🔗 Real-time analytics connected'),
      onDisconnect: () => console.log('🔌 Real-time analytics disconnected'),
      onError: (error) => console.error('❌ Real-time analytics error:', error)
    }
  );
}

/**
 * Hook for batch operations with progress tracking
 */
export function useBatchMutation<T, V>(
  mutationFn: (variables: V) => Promise<ApiResponse<T>>,
  options: UseMutationOptions<T, V> & {
    onProgress?: (completed: number, total: number) => void;
  } = {}
) {
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const mutation = usePowerfulMutation(mutationFn, options);

  const batchMutate = useCallback(async (variablesArray: V[]): Promise<ApiResponse<T>[]> => {
    setProgress({ completed: 0, total: variablesArray.length });
    
    const results: ApiResponse<T>[] = [];
    
    for (let i = 0; i < variablesArray.length; i++) {
      try {
        const result = await mutation.mutate(variablesArray[i]);
        results.push(result);
        
        setProgress({ completed: i + 1, total: variablesArray.length });
        options.onProgress?.(i + 1, variablesArray.length);
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }, [mutation, options.onProgress]);

  return {
    ...mutation,
    batchMutate,
    progress
  };
}

/**
 * Hook for file operations
 */
export function useFileOperations() {
  return {
    uploadPlayerFiles: usePowerfulMutation(
      ({ playerId, files, options }: { playerId: string; files: File[]; options?: any }) =>
        powerfulAPI.uploadPlayerFiles(playerId, files, options),
      { showSuccessToast: true, showErrorToast: true }
    ),
    importPlayers: usePowerfulMutation(
      ({ file, options }: { file: File; options?: any }) =>
        powerfulAPI.importPlayersData(file, options),
      { showSuccessToast: true, showErrorToast: true }
    ),
    exportPlayers: useCallback(async (filters: any = {}, format: string = 'csv') => {
      try {
        const blob = await powerfulAPI.exportPlayersData(filters, format);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `players-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Export completed successfully!');
      } catch (error: any) {
        toast.error('Export failed: ' + error.message);
      }
    }, [])
  };
}

export default {
  usePowerfulAPI,
  usePowerfulMutation,
  useRealTimeData,
  useInfiniteAPI,
  usePlayers,
  usePlayer,
  usePlayerMutation,
  useDashboardAnalytics,
  usePlayerAnalytics,
  usePlayerSearch,
  useRealTimeAnalytics,
  useBatchMutation,
  useFileOperations
};