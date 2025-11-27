// Test script to verify player section functionality
console.log('Testing player section functionality...');

// Test 1: Check if demo account detection works
console.log('Test 1: Demo account detection');
const isDemo = localStorage.getItem('user_type') === 'demo' || 
               localStorage.getItem('is_demo_account') === 'true' ||
               window.location.hostname === 'localhost';
console.log('Is demo account:', isDemo);

// Test 2: Check player management service
console.log('Test 2: Player management service');
import('./src/services/playerManagementService.js').then(({ playerManagementService }) => {
  console.log('Player management service loaded');
  
  // Test 3: Try to get players
  console.log('Test 3: Getting players');
  playerManagementService.getPlayers().then(players => {
    console.log('Players loaded:', players.length);
    console.log('Sample player:', players[0]);
  }).catch(error => {
    console.error('Error getting players:', error);
  });
  
  // Test 4: Check if data management service works
  console.log('Test 4: Data management service');
  import('./src/services/dataManagementService.js').then(({ dataManagementService }) => {
    console.log('Data management service loaded');
    
    dataManagementService.getPlayers().then(players => {
      console.log('Data management players loaded:', players.length);
    }).catch(error => {
      console.error('Error getting players from data management service:', error);
    });
  });
}).catch(error => {
  console.error('Error loading services:', error);
});

console.log('Test completed');