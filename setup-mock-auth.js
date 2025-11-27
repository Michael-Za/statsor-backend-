// Demo account setup for development
// This file can be run in the browser console to set up demo account

localStorage.setItem('auth_token', 'demo-jwt-token-for-development');
localStorage.setItem('statsor_user', JSON.stringify({
  id: 'demo-user-id',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'manager',
  team_id: 'demo-team-id',
  provider: 'demo', // This marks it as a demo account
  isDemo: true
}));

console.log('✅ Demo account set up successfully!');
console.log('📊 Players section: http://localhost:3009/players');
console.log('🤖 AI Assistant: Should work with demo responses');
console.log('🔥 Features enabled:');
console.log('   - Mock player data (3 sample players)');
console.log('   - Demo AI responses');
console.log('   - No backend authentication required');
console.log('');
console.log('Regular users will still need proper authentication and will see real data.');
