import { dataManagementService, Player } from '../services/dataManagementService';
import { demoAccountService } from '../services/demoAccountService';
import { toast } from 'sonner';

// Define the players we want to add for real accounts
const playersToAdd: Partial<Player>[] = [
  {
    name: 'Marcus Johnson',
    first_name: 'Marcus',
    last_name: 'Johnson',
    position: 'Forward',
    age: 24,
    nationality: 'England',
    jersey_number: 9,
    height: 185,
    weight: 78,
    rating: 87,
    goals: 15,
    assists: 8,
    yellow_cards: 3,
    red_cards: 0,
    status: 'active',
    minutes: 2520, // 28 matches * 90 minutes
    shots: 45,
    shots_on_target: 28,
    passes: 320,
    pass_accuracy: 82,
    fouls_committed: 12,
    fouls_received: 18,
    balls_lost: 25,
    balls_recovered: 15,
    duels_won: 65,
    duels_lost: 35,
    crosses: 8,
    games: 28
  },
  {
    name: 'Alessandro Rodriguez',
    first_name: 'Alessandro',
    last_name: 'Rodriguez',
    position: 'Midfielder',
    age: 26,
    nationality: 'Spain',
    jersey_number: 8,
    height: 178,
    weight: 72,
    rating: 84,
    goals: 6,
    assists: 12,
    yellow_cards: 5,
    red_cards: 1,
    status: 'active',
    minutes: 2700, // 30 matches * 90 minutes
    shots: 32,
    shots_on_target: 18,
    passes: 850,
    pass_accuracy: 88,
    fouls_committed: 20,
    fouls_received: 25,
    balls_lost: 40,
    balls_recovered: 65,
    duels_won: 78,
    duels_lost: 42,
    crosses: 22,
    games: 30
  },
  {
    name: 'David Thompson',
    first_name: 'David',
    last_name: 'Thompson',
    position: 'Defender',
    age: 29,
    nationality: 'Scotland',
    jersey_number: 4,
    height: 190,
    weight: 85,
    rating: 82,
    goals: 2,
    assists: 3,
    yellow_cards: 8,
    red_cards: 0,
    status: 'active',
    minutes: 2880, // 32 matches * 90 minutes
    shots: 12,
    shots_on_target: 6,
    passes: 680,
    pass_accuracy: 85,
    fouls_committed: 25,
    fouls_received: 30,
    balls_lost: 18,
    balls_recovered: 85,
    duels_won: 112,
    duels_lost: 38,
    crosses: 5,
    games: 32
  },
  {
    name: 'Lucas Silva',
    first_name: 'Lucas',
    last_name: 'Silva',
    position: 'Goalkeeper',
    age: 27,
    nationality: 'Brazil',
    jersey_number: 1,
    height: 192,
    weight: 88,
    rating: 85,
    goals: 0,
    assists: 1,
    yellow_cards: 2,
    red_cards: 0,
    status: 'active',
    minutes: 2700, // 30 matches * 90 minutes
    shots: 0,
    shots_on_target: 0,
    passes: 420,
    pass_accuracy: 88,
    fouls_committed: 2,
    fouls_received: 5,
    balls_lost: 3,
    balls_recovered: 12,
    duels_won: 15,
    duels_lost: 5,
    crosses: 0,
    saves: 95,
    games: 30
  },
  {
    name: 'Kevin Martinez',
    first_name: 'Kevin',
    last_name: 'Martinez',
    position: 'Midfielder',
    age: 25,
    nationality: 'Argentina',
    jersey_number: 10,
    height: 175,
    weight: 70,
    rating: 88,
    goals: 8,
    assists: 15,
    yellow_cards: 2,
    red_cards: 0,
    status: 'active',
    minutes: 2250, // 25 matches * 90 minutes
    shots: 38,
    shots_on_target: 22,
    passes: 720,
    pass_accuracy: 90,
    fouls_committed: 8,
    fouls_received: 15,
    balls_lost: 22,
    balls_recovered: 58,
    duels_won: 68,
    duels_lost: 28,
    crosses: 18,
    games: 25
  },
  {
    name: 'Thomas Anderson',
    first_name: 'Thomas',
    last_name: 'Anderson',
    position: 'Defender',
    age: 28,
    nationality: 'Germany',
    jersey_number: 5,
    height: 188,
    weight: 82,
    rating: 83,
    goals: 3,
    assists: 2,
    yellow_cards: 4,
    red_cards: 1,
    status: 'active',
    minutes: 2610, // 29 matches * 90 minutes
    shots: 15,
    shots_on_target: 8,
    passes: 620,
    pass_accuracy: 86,
    fouls_committed: 18,
    fouls_received: 22,
    balls_lost: 15,
    balls_recovered: 78,
    duels_won: 105,
    duels_lost: 35,
    crosses: 3,
    games: 29
  },
  {
    name: 'Carlos Ramirez',
    first_name: 'Carlos',
    last_name: 'Ramirez',
    position: 'Forward',
    age: 23,
    nationality: 'Colombia',
    jersey_number: 11,
    height: 180,
    weight: 75,
    rating: 86,
    goals: 12,
    assists: 6,
    yellow_cards: 3,
    red_cards: 0,
    status: 'active',
    minutes: 1980, // 22 matches * 90 minutes
    shots: 42,
    shots_on_target: 25,
    passes: 280,
    pass_accuracy: 78,
    fouls_committed: 10,
    fouls_received: 18,
    balls_lost: 20,
    balls_recovered: 22,
    duels_won: 55,
    duels_lost: 25,
    crosses: 6,
    games: 22
  },
  {
    name: 'James Wilson',
    first_name: 'James',
    last_name: 'Wilson',
    position: 'Midfielder',
    age: 27,
    nationality: 'England',
    jersey_number: 6,
    height: 182,
    weight: 77,
    rating: 81,
    goals: 4,
    assists: 9,
    yellow_cards: 6,
    red_cards: 0,
    status: 'active',
    minutes: 2790, // 31 matches * 90 minutes
    shots: 28,
    shots_on_target: 16,
    passes: 680,
    pass_accuracy: 84,
    fouls_committed: 22,
    fouls_received: 28,
    balls_lost: 32,
    balls_recovered: 72,
    duels_won: 85,
    duels_lost: 45,
    crosses: 15,
    games: 31
  }
];

/**
 * Add players to the database for real accounts
 */
export const addPlayersToDatabase = async (): Promise<void> => {
  try {
    // Check if we're in a demo account
    const isDemo = localStorage.getItem('user_type') === 'demo';
    
    if (isDemo) {
      console.log('Demo account detected. Players are already available in demo mode.');
      toast.info('Demo account detected. Players are already available in demo mode.');
      return;
    }

    // For real accounts, add players to the database
    let successCount = 0;
    let errorCount = 0;

    for (const player of playersToAdd) {
      try {
        const result = await dataManagementService.addPlayer(player as Player);
        if (result) {
          successCount++;
          console.log(`Successfully added player: ${player.name}`);
        } else {
          errorCount++;
          console.error(`Failed to add player: ${player.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error adding player ${player.name}:`, error);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully added ${successCount} players to the database!`);
    }
    
    if (errorCount > 0) {
      toast.warning(`${errorCount} players failed to be added.`);
    }

    console.log(`Player setup complete: ${successCount} successful, ${errorCount} errors`);
  } catch (error) {
    console.error('Error in addPlayersToDatabase:', error);
    toast.error('Failed to add players to the database');
  }
};

/**
 * Initialize players for both demo and real accounts
 */
export const initializePlayers = async (): Promise<void> => {
  try {
    await addPlayersToDatabase();
    toast.success('Player initialization complete!');
  } catch (error) {
    console.error('Error initializing players:', error);
    toast.error('Failed to initialize players');
  }
};

/**
 * Get demo players for testing
 */
export const getDemoPlayers = (): Player[] => {
  return demoAccountService.getDemoPlayers();
};