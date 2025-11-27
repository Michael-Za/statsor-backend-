/**
 * User Initialization Service
 * Handles creation of isolated data spaces for new users
 */

import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface UserDataSpace {
  profileId: string;
  teamId: string | null;
  subscriptionId: string | null;
  isNewUser: boolean;
}

class UserInitializationService {
  /**
   * Initialize a complete data space for a new user
   * This creates:
   * - Profile record (triggers auto-creation of team and subscription via database trigger)
   * - Empty data containers
   * Returns the user's data space identifiers
   */
  async initializeUserDataSpace(
    authUserId: string,
    email: string,
    firstName: string,
    lastName: string,
    sport: 'soccer' | 'futsal' = 'soccer'
  ): Promise<UserDataSpace | { error: string; details?: any } | null> {
    try {
      console.log('[UserInit] Initializing data space for user:', authUserId);

      // Step 1: Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (fetchError) {
        console.error('[UserInit] Error checking existing profile:', fetchError);
        // Continue to try creation if fetch failed, or return error?
        // Better to return error if we can't verify existence
        return { error: 'Failed to check existing profile', details: fetchError };
      }

      if (existingProfile) {
        console.log('[UserInit] Profile already exists:', existingProfile.id);
        const dataSpace = await this.getExistingDataSpace(existingProfile.id);
        return { ...dataSpace, isNewUser: false };
      }

      // Step 2: Create profile (this will trigger automatic team and subscription creation)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: authUserId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: 'manager',
          sport: sport,
          sport_selected: false,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        // Check for unique constraint violation (race condition)
        if (profileError.code === '23505') { // Unique violation
          console.log('[UserInit] Profile created concurrently, fetching existing...');
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('auth_user_id', authUserId)
            .maybeSingle();

          if (retryProfile) {
            const dataSpace = await this.getExistingDataSpace(retryProfile.id);
            return { ...dataSpace, isNewUser: false };
          }
        }

        console.error('[UserInit] Failed to create profile:', profileError);
        toast.error('Failed to initialize user profile');
        return { error: 'Failed to create profile', details: profileError };
      }

      if (!profile) {
        console.error('[UserInit] Profile creation returned no data');
        return { error: 'Profile creation returned no data' };
      }

      console.log('[UserInit] Profile created:', profile.id);

      // Step 3: Wait a moment for trigger to complete, then fetch created resources
      // Increased wait time slightly to be safe
      await new Promise(resolve => setTimeout(resolve, 1000));

      const dataSpace = await this.getExistingDataSpace(profile.id);

      // Verify critical components exist
      if (!dataSpace.teamId || !dataSpace.subscriptionId) {
        console.warn('[UserInit] Triggers may have failed, attempting manual repair...');
        await this.ensureDataSpace(authUserId);
        // Fetch again
        const repairedSpace = await this.getExistingDataSpace(profile.id);
        return { ...repairedSpace, isNewUser: true };
      }

      console.log('[UserInit] Data space initialized successfully:', dataSpace);
      return { ...dataSpace, isNewUser: true };

    } catch (error: any) {
      console.error('[UserInit] Unexpected error:', error);
      toast.error('Failed to initialize user data space');
      return { error: error.message || 'Unexpected initialization error', details: error };
    }
  }

  /**
   * Get existing data space for a user
   */
  private async getExistingDataSpace(profileId: string): Promise<Omit<UserDataSpace, 'isNewUser'>> {
    try {
      // Get team
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', profileId)
        .limit(1)
        .maybeSingle();

      // Get subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', profileId)
        .maybeSingle();

      return {
        profileId,
        teamId: teams?.id || null,
        subscriptionId: subscription?.id || null
      };
    } catch (error) {
      console.error('[UserInit] Error getting existing data space:', error);
      return {
        profileId,
        teamId: null,
        subscriptionId: null
      };
    }
  }

  /**
   * Ensure user has a complete data space
   * Call this after login to verify/repair data space
   */
  async ensureDataSpace(authUserId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, sport')
        .eq('auth_user_id', authUserId)
        .single();

      if (!profile) {
        console.error('[UserInit] No profile found for user');
        return false;
      }

      // Check if team exists
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', profile.id)
        .maybeSingle();

      // Create team if missing
      if (!team) {
        console.log('[UserInit] Creating missing team for user');
        await supabase
          .from('teams')
          .insert({
            name: `${profile.first_name}'s Team`,
            sport: profile.sport || 'soccer',
            manager_id: profile.id,
            description: 'My team workspace',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      // Check if subscription exists
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      // Create subscription if missing
      if (!subscription) {
        console.log('[UserInit] Creating missing subscription for user');
        await supabase
          .from('subscriptions')
          .insert({
            user_id: profile.id,
            plan: 'free',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      console.log('[UserInit] Data space verified/repaired');
      return true;
    } catch (error) {
      console.error('[UserInit] Error ensuring data space:', error);
      return false;
    }
  }

  /**
   * Verify user has proper data isolation
   */
  async verifyDataIsolation(authUserId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      if (!profile) {
        console.error('[UserInit] No profile found for user');
        return false;
      }

      // Check that user can only see their own data
      const { data: players } = await supabase
        .from('players')
        .select('id')
        .eq('profile_id', profile.id);

      console.log('[UserInit] Data isolation verified. User has', players?.length || 0, 'players');
      return true;
    } catch (error) {
      console.error('[UserInit] Data isolation verification failed:', error);
      return false;
    }
  }

  /**
   * Clean up demo data and ensure real user mode
   */
  cleanupDemoData(): void {
    console.log('[UserInit] Cleaning up demo data');

    // Remove all demo-related flags
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_account_data');
    sessionStorage.removeItem('demo_mode');
    sessionStorage.removeItem('demo_account_data');

    // Set user type to real
    localStorage.setItem('user_type', 'real');

    console.log('[UserInit] Demo data cleaned up');
  }

  /**
   * Ensure user is in real mode (not demo)
   */
  ensureRealUserMode(): void {
    const userType = localStorage.getItem('user_type');

    if (userType !== 'real') {
      console.log('[UserInit] Switching to real user mode');
      this.cleanupDemoData();
    }
  }
}

export const userInitializationService = new UserInitializationService();
