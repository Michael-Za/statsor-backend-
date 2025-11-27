// Script to set up demo mode for testing player section
console.log('Setting up demo mode...');

// Set demo account flags
localStorage.setItem('user_type', 'demo');
localStorage.setItem('is_demo_account', 'true');

// Set a mock user
const mockUser = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  provider: 'demo',
  isDemo: true,
  type: 'demo'
};

localStorage.setItem('statsor_user', JSON.stringify(mockUser));

console.log('Demo mode set up successfully');
console.log('User type:', localStorage.getItem('user_type'));
console.log('Is demo account:', localStorage.getItem('is_demo_account'));
console.log('User:', localStorage.getItem('statsor_user'));

// Test the player services
import('./src/services/playerManagementService.js').then(({ playerManagementService }) => {
  console.log('Testing player management service...');
  
  playerManagementService.getPlayers().then(players => {
    console.log('✓ Players loaded successfully:', players.length);
    if (players.length > 0) {
      console.log('✓ Sample player:', players[0].name);
    }
  }).catch(error => {
    console.error('✗ Error getting players:', error);
  });
  
  // Test data management service
  import('./src/services/dataManagementService.js').then(({ dataManagementService }) => {
    console.log('Testing data management service...');
    
    dataManagementService.getPlayers().then(players => {
      console.log('✓ Data management players loaded:', players.length);
      if (players.length > 0) {
        console.log('✓ Sample player:', players[0].name);
      }
    }).catch(error => {
      console.error('✗ Error getting players from data management service:', error);
    });
  });
}).catch(error => {
  console.error('✗ Error loading services:', error);
});

console.log('Demo mode setup completed');