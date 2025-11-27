import { dataManagementService, Player } from './dataManagementService';

describe('DataManagementService', () => {
  beforeEach(() => {
    // Clear cache before each test
    dataManagementService.clearCache();
  });

  describe('getPlayers', () => {
    it('should return fallback players when API is unavailable', async () => {
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
        },
        writable: true,
      });

      const players = await dataManagementService.getPlayers();
      
      // Should return array of players
      expect(Array.isArray(players)).toBe(true);
      
      // Should have at least one player
      expect(players.length).toBeGreaterThan(0);
      
      // Each player should have required fields
      players.forEach(player => {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('first_name');
        expect(player).toHaveProperty('last_name');
        expect(player).toHaveProperty('position');
      });
    });

    it('should return cached data on subsequent calls', async () => {
      const firstCall = await dataManagementService.getPlayers();
      const secondCall = await dataManagementService.getPlayers();
      
      // Both calls should return the same data
      expect(firstCall).toEqual(secondCall);
    });
  });

  describe('getClubData', () => {
    it('should return fallback club data when API is unavailable', async () => {
      const clubData = await dataManagementService.getClubData();
      
      // Should have required fields
      expect(clubData).toHaveProperty('id');
      expect(clubData).toHaveProperty('name');
      expect(clubData).toHaveProperty('founded');
      expect(clubData).toHaveProperty('stadium');
    });
  });
});