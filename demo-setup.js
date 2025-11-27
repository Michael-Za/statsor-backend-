/**
 * Demo Account Setup Script
 * 
 * This script creates a demo account with sample data for new users to explore the platform.
 * Simply run this script in your browser's console to set up a demo account.
 * 
 * Instructions:
 * 1. Open your browser's developer tools (F12 or right-click → Inspect)
 * 2. Go to the Console tab
 * 3. Paste this entire script and press Enter
 * 4. Refresh the page to see the demo account in action
 */

(function() {
  console.log('🚀 Setting up demo account...');
  
  // Demo user data
  const demoUser = {
    id: 'demo_' + Date.now(),
    email: 'demo@statsor.com',
    name: 'Demo User',
    provider: 'demo',
    sportSelected: true,
    created_at: new Date().toISOString()
  };
  
  // Demo account data
  const demoData = {
    players: [
      {
        id: 'demo-1',
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
        matches: 28,
        goals: 15,
        assists: 8,
        yellow_cards: 3,
        red_cards: 0,
        status: 'active',
        contract_end: '2025-06-30',
        salary: 45000,
        market_value: 2500000,
        skills: {
          technical: 85,
          physical: 80,
          tactical: 78,
          mental: 88
        },
        team_id: 'demo-team-1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-12-15T14:30:00Z'
      },
      {
        id: 'demo-2',
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
        matches: 30,
        goals: 6,
        assists: 12,
        yellow_cards: 5,
        red_cards: 1,
        status: 'active',
        contract_end: '2026-06-30',
        salary: 38000,
        market_value: 1800000,
        skills: {
          technical: 72,
          physical: 70,
          tactical: 85,
          mental: 75
        },
        team_id: 'demo-team-1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-12-15T14:30:00Z'
      },
      {
        id: 'demo-3',
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
        matches: 32,
        goals: 2,
        assists: 3,
        yellow_cards: 8,
        red_cards: 0,
        status: 'active',
        contract_end: '2024-06-30',
        salary: 32000,
        market_value: 1200000,
        skills: {
          technical: 45,
          physical: 88,
          tactical: 78,
          mental: 65
        },
        team_id: 'demo-team-1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-12-15T14:30:00Z'
      },
      {
        id: 'demo-4',
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
        matches: 30,
        goals: 0,
        assists: 1,
        yellow_cards: 2,
        red_cards: 0,
        status: 'active',
        contract_end: '2025-06-30',
        salary: 40000,
        market_value: 1500000,
        skills: {
          technical: 68,
          physical: 85,
          tactical: 75,
          mental: 70
        },
        team_id: 'demo-team-1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-12-15T14:30:00Z'
      }
    ],
    club: {
      id: 'demo-team-1',
      name: 'Statsor FC',
      founded: 1995,
      stadium: 'Victory Stadium',
      capacity: 45000,
      address: '123 Football Street',
      phone: '+1-234-567-8900',
      email: 'info@statsorfc.com',
      budget: 15000000,
      trophies: 3,
      notes: 'Demo club for testing purposes'
    },
    matches: [
      {
        id: 'match-1',
        opponent: 'Arsenal FC',
        date: '2024-12-20',
        result: 'win',
        score: '2-1',
        venue: 'home',
        competition: 'Premier League',
        attendance: 42000
      },
      {
        id: 'match-2',
        opponent: 'Manchester City',
        date: '2024-12-15',
        result: 'draw',
        score: '1-1',
        venue: 'away',
        competition: 'Premier League',
        attendance: 55000
      }
    ]
  };
  
  // Store demo data
  localStorage.setItem('auth_token', 'demo-token-' + Date.now());
  localStorage.setItem('statsor_user', JSON.stringify(demoUser));
  localStorage.setItem('user_type', 'demo');
  localStorage.setItem('statsor_sport', 'soccer');
  localStorage.setItem('statsor_sport_selection_completed', 'true');
  localStorage.setItem('demo_account_data', JSON.stringify(demoData));
  
  console.log('✅ Demo account created successfully!');
  console.log('📊 Players section: http://localhost:3006/players');
  console.log('🤖 AI Assistant: Should work with demo responses');
  console.log('🔥 Features available in demo:');
  console.log('   - 4 sample players with detailed statistics');
  console.log('   - Team management');
  console.log('   - Match tracking');
  console.log('   - Demo AI responses');
  console.log('');
  console.log('🔄 Please refresh the page to see the demo account in action.');
  console.log('💡 To switch to a real account, simply sign out and create a new account.');
})();