import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface DatabaseContextType {
  databaseManager: any | null;
  backupManager: any | null;
  isInitialized: boolean;
  isOnline: boolean;
  syncStatus: any;
  performanceMetrics: any;
  error: string | null;
  initializeDatabase: () => Promise<void>;
  forceSync: () => Promise<void>;
  createBackup: () => Promise<void>;
  clearCache: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [databaseManager, setDatabaseManager] = useState<any | null>(null);
  const [backupManager, setBackupManager] = useState<any | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Application is online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Application is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeDatabase = async (): Promise<void> => {
    try {
      setError(null);
      console.log('Initializing database...');

      // Mock database manager for demo
      const mockDbManager = {
        initialize: async () => {},
        create: async (table: string, data: any) => ({ id: Date.now().toString(), ...data }),
        update: async (table: string, id: string, data: any) => ({ id, ...data }),
        delete: async (table: string, id: string) => {},
        findById: async (table: string, id: string) => null,
        findAll: async (table: string) => [],
        exportData: async () => JSON.stringify({ data: {}, metadata: { total_records: 0 } }),
        forcSync: async () => {},
        getSyncStatus: async () => ({ pending: 0, processing: 0, failed: 0, completed_today: 0 }),
        getPerformanceMetrics: async () => ({ summary: { cache_hit_rate: 85, query_time: 50, sync_duration: 1000 } }),
        clearCache: () => {},
        createPlayer: async (data: any) => ({ id: Date.now().toString(), ...data }),
        createTeam: async (data: any) => ({ id: Date.now().toString(), ...data }),
        createMatch: async (data: any) => ({ id: Date.now().toString(), ...data })
      };

      const mockBackupManager = {
        createBackup: async () => ({ id: Date.now().toString(), timestamp: new Date().toISOString() })
      };

      setDatabaseManager(mockDbManager);
      setBackupManager(mockBackupManager);
      setIsInitialized(true);
      
      console.log('Database initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to initialize database', err);
      throw err;
    }
  };

  const forceSync = async (): Promise<void> => {
    if (!databaseManager) {
      throw new Error('Database not initialized');
    }

    try {
      await databaseManager.forcSync();
      console.log('Force sync completed');
    } catch (err) {
      console.error('Force sync failed', err);
      throw err;
    }
  };

  const createBackup = async (): Promise<void> => {
    if (!backupManager) {
      throw new Error('Backup manager not initialized');
    }

    try {
      await backupManager.createBackup();
      console.log('Manual backup created');
    } catch (err) {
      console.error('Manual backup failed', err);
      throw err;
    }
  };

  const clearCache = (): void => {
    if (databaseManager) {
      databaseManager.clearCache();
      console.log('Cache cleared');
    }
  };

  const value: DatabaseContextType = {
    databaseManager,
    backupManager,
    isInitialized,
    isOnline,
    syncStatus,
    performanceMetrics,
    error,
    initializeDatabase,
    forceSync,
    createBackup,
    clearCache
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};