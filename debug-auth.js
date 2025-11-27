// Debug script to check authentication and profile status
import { supabase } from './src/lib/supabase.ts';

async function debugAuth() {
  console.log('=== Authentication Debug ===');
  
  // Check current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Session:', session ? 'Active' : 'None', sessionError);
  
  if (session) {
    console.log('User ID:', session.user.id);
    console.log('Email:', session.user.email);
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();
    
    console.log('Profile:', profile, profileError);
    
    if (profile) {
      // Check players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('profile_id', profile.id);
      
      console.log('Players:', players?.length || 0, playersError);
      
      // Check matches
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', profile.id);
      
      console.log('Teams:', teams?.length || 0, teamsError);
    }
  }
  
  // Check localStorage
  console.log('LocalStorage user_type:', localStorage.getItem('user_type'));
  console.log('LocalStorage statsor_user:', localStorage.getItem('statsor_user'));
}

debugAuth().catch(console.error);
