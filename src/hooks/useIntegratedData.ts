import { useState, useEffect, useCallback } from 'react';
import { dataIntegrationService } from '../services/dataIntegrationService';
import { dataManagementService, Player, ClubData } from '../services/dataManagementService';
import { UserData } from '../components/EnhancedAIAssistant';

interface AnalyticsData {
  totalPlayers: number;
  activeContracts: number;
  totalRevenue: number;
  avgPlayerRating: number;
  matchesPlayed: number;
  goalsScored: number;
  cleanSheets: number;
  winRate: number;
}

interface UseIntegratedDataReturn {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updatePlayerData: (playerId: string, updates: Partial<Player>) => Promise<boolean>;
  getPlayerStats: (playerId: string) => Promise<any>;
}

/**
 * Custom hook to manage integrated data between Data Management and AI Assistant
 */
export const useIntegratedData = (): UseIntegratedDataReturn => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate analytics based on actual user data
  const calculateAnalytics = useCallback((players: Player[], clubData: ClubData | null): AnalyticsData => {
    return {
      totalPlayers: players.length,
      activeContracts: players.filter(p => p.status === 'active').length,
      totalRevenue: clubData?.revenue || 0,
      avgPlayerRating: players.length > 0 ? players.reduce((sum, p) => sum + (p.rating || 0), 0) / players.length : 0,
      matchesPlayed: players.length > 0 ? Math.max(...players.map(p => p.matches || 0)) : 0,
      goalsScored: players.reduce((sum, p) => sum + (p.goals || 0), 0),
      cleanSheets: 0, // This would be calculated from actual match data
      winRate: 0 // This would be calculated from actual match data
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we're in development mode or if API is unavailable
      const isDevelopment = import.meta.env?.MODE === 'development';
      const enableMockData = import.meta.env?.['VITE_ENABLE_MOCK_DATA'] === 'true';
      
      if (isDevelopment || enableMockData) {
        // In development/mock mode, use fallback data
        const players = await dataManagementService.getPlayers();
        const clubData = await dataManagementService.getClubData();
        const analytics = calculateAnalytics(players, clubData);
        
        const integratedData = await dataIntegrationService.getIntegratedUserData(
          players,
          clubData ? [clubData] : [],
          analytics
        );

        setUserData(integratedData);
        setIsLoading(false);
        return;
      }

      // Fetch real data from backend API
      const [players, clubData] = await Promise.all([
        dataManagementService.getPlayers(),
        dataManagementService.getClubData()
      ]);
      
      // Calculate analytics based on real data
      const analytics = calculateAnalytics(players, clubData);
      
      // Transform and integrate the data using our service
      const integratedData = await dataIntegrationService.getIntegratedUserData(
        players,
        clubData ? [clubData] : [],
        analytics
      );

      setUserData(integratedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load integrated data';
      setError(errorMessage);
      console.error('Error loading integrated data:', err);
      
      // Try to load fallback data
      try {
        const players = await dataManagementService.getPlayers();
        const clubData = await dataManagementService.getClubData();
        const analytics = calculateAnalytics(players, clubData);
        
        const integratedData = await dataIntegrationService.getIntegratedUserData(
          players,
          clubData ? [clubData] : [],
          analytics
        );

        setUserData(integratedData);
        toast.info('Showing demo data while we resolve connection issues');
      } catch (fallbackError) {
        console.error('Error loading fallback data:', fallbackError);
        setError('Failed to load both real and demo data. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [calculateAnalytics]);

  const refreshData = useCallback(async () => {
    dataIntegrationService.clearCache();
    await loadData();
  }, [loadData]);

  const updatePlayerData = useCallback(async (playerId: string, updates: Partial<Player>): Promise<boolean> => {
    try {
      // Update player data using the backend API
      await dataManagementService.updatePlayer(playerId, updates);
      
      // Refresh the data to reflect changes
      await refreshData();
      
      return true;
    } catch (err) {
      console.error('Error updating player data:', err);
      return false;
    }
  }, [refreshData]);

  const getPlayerStats = useCallback(async (playerId: string) => {
    try {
      // Get current players from backend API
      const players = await dataManagementService.getPlayers();
      return await dataIntegrationService.getPlayerStats(playerId, players);
    } catch (err) {
      console.error('Error getting player stats:', err);
      return null;
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up periodic refresh (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        refreshData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshData, isLoading]);

  return {
    userData,
    isLoading,
    error,
    refreshData,
    updatePlayerData,
    getPlayerStats
  };
};

export default useIntegratedData;