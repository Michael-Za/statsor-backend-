import { demoAccountService } from '../services/demoAccountService';

// Initialize demo account data
const initDemoAccount = () => {
  try {
    // Initialize demo account with all data
    const demoData = demoAccountService.initializeDemoAccount();
    
    // Also set the user type
    localStorage.setItem('user_type', 'demo');
    
    // Set default sport for demo account
    localStorage.setItem('statsor_sport', 'soccer');
    localStorage.setItem('statsor_sport_selection_completed', 'true');
    
    console.log('Demo account initialized successfully');
    console.log('Demo players count:', demoData.players.length);
    
    return demoData;
  } catch (error) {
    console.error('Error initializing demo account:', error);
    return null;
  }
};

// Run the initialization
const result = initDemoAccount();
export default result;