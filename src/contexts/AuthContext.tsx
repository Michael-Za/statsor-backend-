import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authAPI } from '../lib/api';
import { supabase } from '../lib/supabase';
import { csrfToken, rateLimiter, secureStorage } from '../utils/security';
import { userInitializationService } from '../services/userInitializationService';
import { sessionManager } from '../utils/sessionManager';
import { emailService } from '../services/emailService';

// Security rate limiter for password reset
const passwordResetLimiter = rateLimiter.create(3, 300000); // 3 attempts per 5 minutes

interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string | undefined;
  avatar?: string | undefined;
  given_name?: string | undefined;
  family_name?: string | undefined;
  locale?: string | undefined;
  verified_email?: boolean | undefined;
  created_at?: string | undefined;
  location?: string | undefined;
  provider: 'google' | 'email';
  sport?: 'soccer' | 'futsal' | undefined;
  sportSelected?: boolean | undefined;
  display_name?: string | undefined;
  phone?: string | undefined;
  bio?: string | undefined;
  userNumber?: number | undefined;
}

interface AuthResponse<T = unknown> {
  data: T;
  error: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
  isInitialized: boolean;
  setUser: (user: UserProfile | null) => void;
  signUp: (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<{ data: unknown; error: string | null }>;
  handleGoogleCallback: (code: string, state?: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateSportPreference: (sport: 'soccer' | 'futsal') => Promise<AuthResponse>;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ) => Promise<AuthResponse>;
  resetPassword?: (email: string) => Promise<AuthResponse>;
  verifyResetCode?: (email: string, code: string) => Promise<{ data: { valid: boolean; message?: string }; error: string | null }>;
  resetPasswordWithCode?: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<AuthResponse>;
  updateProfile?: (data: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: string | null }>;
  updateUser?: (data: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const navigate = useNavigate();

  // Session validation and token refresh
  const validateSession = async (): Promise<boolean> => {
    try {
      const token = secureStorage.getItem('auth_token');
      if (!token) return false;

      // Validate token with backend
      const response = await authAPI.validateToken({ token });

      return response.data.valid;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const token = secureStorage.getItem('auth_token');
      if (!token) return false;

      const response = await authAPI.refreshToken({ token });
      if (response.data.token) {
        secureStorage.setItem('auth_token', response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing authentication...');

        // Always clean up demo data on init
        userInitializationService.cleanupDemoData();

        // Try to restore session from Supabase first
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session && !error) {
          console.log('[AuthContext] Active Supabase session found');

          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();

          if (profile) {
            // Ensure user has complete data space
            await userInitializationService.ensureDataSpace(session.user.id);

            const sportValue = profile['sport'];
            const userName = profile['first_name'] && profile['last_name']
              ? `${profile['first_name']} ${profile['last_name']}`.trim()
              : session.user.email!.split('@')[0];
            const userProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email!,
              name: userName || 'User',
              provider: 'email' as const,
              sportSelected: profile['sport_selected'] || false
            };
            if (sportValue === 'soccer' || sportValue === 'futsal') {
              userProfile.sport = sportValue;
            }

            setUser(userProfile);
            setHasCompletedOnboarding(profile.sport_selected || false);
            setIsNewUser(false);

            // Save session
            const sessionData = {
              token: session.access_token,
              refreshToken: session.refresh_token ?? undefined,
              expiresAt: new Date(session.expires_at ?? Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(),
              userId: session.user.id,
              profileId: profile.id
            };
            sessionManager.saveSession(sessionData);
            secureStorage.setItem('statsor_user', JSON.stringify(userProfile));

            console.log('[AuthContext] Session restored successfully');
          } else {
            console.warn('[AuthContext] Session found but no profile - creating profile');
            // Initialize data space for user without profile
            const dataSpace = await userInitializationService.initializeUserDataSpace(
              session.user.id,
              session.user.email!,
              session.user.user_metadata?.['first_name'] || session.user.email!.split('@')[0],
              session.user.user_metadata?.['last_name'] || '',
              'soccer'
            );

            if (dataSpace && !('error' in dataSpace)) {
              const userProfile: UserProfile = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.['name'] || session.user.email!.split('@')[0],
                provider: 'email' as const,
                sportSelected: false
              };
              setUser(userProfile);
              setIsNewUser(true);
              secureStorage.setItem('statsor_user', JSON.stringify(userProfile));
            } else {
              console.error('[AuthContext] Failed to initialize data space during session restore:', dataSpace);
            }
          }
        } else {
          console.log('[AuthContext] No active session found');
        }

        // Generate CSRF token
        const csrf = csrfToken.generate();
        csrfToken.store(csrf);

        setIsInitialized(true);
      } catch (error) {
        console.error('[AuthContext] Failed to initialize auth:', error);
        // Clear potentially corrupted data
        sessionManager.clearSession();
        secureStorage.removeItem('statsor_user');
        localStorage.removeItem('statsor_onboarding_completed');
        csrfToken.clear();
        setIsInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for storage events to sync session across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'statsor_user') {
        if (!e.newValue) {
          // Token removed in another tab - logout
          setUser(null);
          setIsInitialized(true);
        } else if (e.key === 'statsor_user') {
          // User updated in another tab
          try {
            const newUser = JSON.parse(e.newValue);
            setUser(newUser);
          } catch (err) {
            console.error('Failed to parse synced user:', err);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  console.log(user)

  // Set up periodic session validation (every 15 minutes) - separate effect
  useEffect(() => {
    if (!user || !isInitialized) return;

    const sessionCheckInterval = setInterval(
      async () => {
        try {
          const isValid = await validateSession();
          if (!isValid) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              toast.error('Session expired. Please log in again.');
              await logout();
            }
          }
        } catch (error) {
          console.error('Session check failed:', error);
        }
      },
      15 * 60 * 1000
    ); // 15 minutes

    return () => clearInterval(sessionCheckInterval);
  }, [user, isInitialized]);

  const signUp = async (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ) => {
    if (loading || isSigningIn) {
      toast.error('Please wait, authentication in progress...');
      return { data: null, error: 'Authentication in progress' };
    }

    setIsSigningIn(true);
    setLoading(true);
    try {
      console.log('[AuthContext] Initiating email signup for:', email);

      // Clear ALL demo and cached data before signup
      userInitializationService.cleanupDemoData();

      // Parse name into first and last name
      const nameValue = (additionalData && 'name' in additionalData ? String(additionalData['name']) : undefined) || email.split('@')[0];
      const nameParts = (nameValue || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Use backend API directly for signup
      try {
        const response = await authAPI.register({
          email,
          password,
          firstName,
          lastName,
          role: 'manager',
          position: 'midfielder',
          name: (additionalData && 'name' in additionalData ? String(additionalData['name']) : undefined) || email.split('@')[0],
          location: (additionalData?.['location'] as string) || ''
        });

        if (response.data.success && response.data.data) {
          const { user: apiUser, session } = response.data.data;

          // Also create Supabase profile for compatibility
          try {
            const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: (additionalData && 'name' in additionalData ? String(additionalData['name']) : undefined) || email.split('@')[0],
                  location: (additionalData?.['location'] as string) || ''
                }
              }
            });

            if (supabaseError && !supabaseError.message.includes('already registered')) {
              console.warn('[AuthContext] Supabase signup warning:', supabaseError);
            }

            if (supabaseData?.user) {
              // Create profile in Supabase database
              const { data: profile } = await supabase
                .from('profiles')
                .insert({
                  auth_user_id: supabaseData.user.id,
                  email: supabaseData.user.email,
                  first_name: firstName,
                  last_name: lastName,
                  sport_selected: false,
                  status: 'active'
                })
                .select()
                .single();

              if (profile) {
                await supabase
                  .from('subscriptions')
                  .insert({
                    user_id: profile.id,
                    plan: 'free',
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    cancel_at_period_end: false
                  });
              }
            }
          } catch (supabaseErr) {
            console.warn('[AuthContext] Supabase profile creation skipped:', supabaseErr);
          }

          let supabaseUserId = null;
          try {
            const { data: supabaseData } = await supabase.auth.getUser();
            supabaseUserId = supabaseData?.user?.id;
          } catch (e) {
            // Ignore
          }

          const userProfile = {
            id: apiUser?.id || supabaseUserId || 'user_' + Date.now(),
            email: apiUser?.email || email,
            name: (additionalData && 'name' in additionalData ? String(additionalData['name']) : undefined) || apiUser?.first_name || email.split('@')[0],
            provider: 'email' as const,
            sportSelected: false
          };

          setUser(userProfile);
          setIsNewUser(true);

          // Mark as real user (not demo) - CRITICAL
          localStorage.setItem('user_type', 'real');

          if (session?.access_token) {
            secureStorage.setItem('auth_token', session.access_token);
            secureStorage.setItem('statsor_user', JSON.stringify(userProfile));
          }

          toast.success('Account created successfully! Welcome email sent.');
          console.log('[AuthContext] Signup successful - Real user account created with backend API');
          return { data: { user: userProfile }, error: null };
        } else {
          const errorMsg = response.data.error || response.data.message || 'Registration failed';
          toast.error(errorMsg);
          return { data: null, error: errorMsg };
        }
      } catch (apiError: unknown) {
        console.error('[AuthContext] Backend API signup error:', apiError);
        return { data: null, error: (apiError instanceof Error ? apiError.message : 'Signup failed') };
      }
    } catch (error: unknown) {
      console.error('[AuthContext] Unexpected signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
      setIsSigningIn(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (loading || isSigningIn) {
      toast.error('Please wait, authentication in progress...');
      return { data: null, error: 'Authentication in progress' };
    }

    setIsSigningIn(true);
    setLoading(true);
    try {
      console.log('[AuthContext] Initiating email signin for:', email);

      // Clear ALL demo and cached data before signin
      userInitializationService.cleanupDemoData();

      // Use Supabase for signin
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[AuthContext] Signin error:', error);
        toast.error(error.message);
        return { data: null, error: error.message };
      }

      if (data.user && data.session) {
        console.log('[AuthContext] User authenticated:', data.user.id);

        // Ensure user has complete data space
        await userInitializationService.ensureDataSpace(data.user.id);

        // Get profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .single();

        if (!profile) {
          console.error('[AuthContext] No profile found for user');
          toast.error('Account profile not found. Please contact support.');
          return { data: null, error: 'Profile not found' };
        }

        const sportValue = profile?.['sport'];
        const userName = profile?.['first_name'] && profile?.['last_name']
          ? `${profile['first_name']} ${profile['last_name']}`.trim()
          : data.user.email!.split('@')[0];
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email!,
          name: userName || 'User',
          provider: 'email' as const,
          sportSelected: profile?.['sport_selected'] || false
        };
        if (sportValue === 'soccer' || sportValue === 'futsal') {
          userProfile.sport = sportValue;
        }

        setUser(userProfile);
        setIsNewUser(false);
        setHasCompletedOnboarding(profile?.sport_selected || false);

        // Save session with profile ID
        const sessionData = {
          token: data.session.access_token,
          refreshToken: data.session.refresh_token ?? undefined,
          expiresAt: new Date(data.session.expires_at ?? Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(),
          userId: data.user.id,
          profileId: profile.id
        };
        sessionManager.saveSession(sessionData);
        secureStorage.setItem('statsor_user', JSON.stringify(userProfile));

        toast.success('Welcome back!');
        console.log('[AuthContext] Signin successful - Real user account');
        return { data: { user: userProfile }, error: null };
      }

      return { data: null, error: 'Signin failed' };
    } catch (error: unknown) {
      console.error('[AuthContext] Unexpected signin error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signin failed';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
      setIsSigningIn(false);
    }
  };

  const signInWithGoogle = async () => {
    if (loading || isSigningIn) {
      toast.error('Please wait, authentication in progress...');
      return { data: null, error: 'Authentication in progress' };
    }

    setIsSigningIn(true);
    setLoading(true);

    try {
      // Clear any demo data
      userInitializationService.cleanupDemoData();

      console.log('[Auth] Redirecting to backend Google OAuth...');

      // Redirect to backend Google OAuth endpoint
      // Backend will handle OAuth flow and redirect back to frontend with tokens
      const backendUrl = import.meta.env.VITE_API_URL || 'https://widespread-erminia-me11222222-6c28b28e.koyeb.app/api/v1';
      window.location.href = `${backendUrl}/auth/google`;

      return { data: null, error: null };
    } catch (error: unknown) {
      console.error('Google auth error:', error);
      const errorMessage =
        error instanceof Error ? error.message :
          'Google authentication failed. Please check your internet connection and try again.';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      // Don't set loading to false here since we're redirecting
      // setIsSigningIn(false);
      // setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Include CSRF token for secure logout
      const csrf = csrfToken.get();

      // Call logout API with CSRF protection
      try {
        await authAPI.logout({ csrfToken: csrf || '' });
        console.log('User logged out successfully');
      } catch (apiError) {
        console.warn(
          'Logout API call failed, but local session cleared:',
          apiError
        );
        // Don't throw error here as local logout should still proceed
      }

      // Secure cleanup of all stored data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('statsor_user');
      localStorage.removeItem('statsor_sport');
      localStorage.removeItem('statsor_sport_selection_completed');
      localStorage.removeItem('statsor_onboarding_completed');

      // Clear CSRF token and session data
      csrfToken.clear();
      sessionStorage.clear();

      setUser(null);
      setIsNewUser(false);
      setHasCompletedOnboarding(false);

      toast.success('Logged out successfully');
      navigate('/signin');
      return { error: null };
    } catch (error: unknown) {
      console.error('Logout error:', error);
      // Force cleanup even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('statsor_user');
      csrfToken.clear();
      sessionStorage.clear();
      setUser(null);
      toast.error('Logged out (with errors)');
      navigate('/signin');
      return { error: error instanceof Error ? error.message : 'Logout failed' };
    } finally {
      setIsSigningIn(false);
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      console.log('[AuthContext] Logging out user');

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Try backend API logout
      try {
        const csrf = csrfToken.get();
        await authAPI.logout({ csrfToken: csrf || '' });
      } catch (apiError) {
        console.warn('[AuthContext] Backend logout failed:', apiError);
      }

      // Clear session manager
      sessionManager.clearSession();

      // Clear all stored data
      secureStorage.removeItem('statsor_user');
      localStorage.removeItem('statsor_onboarding_completed');
      csrfToken.clear();
      sessionStorage.clear();

      // Reset state
      setUser(null);
      setIsNewUser(false);
      setHasCompletedOnboarding(false);

      toast.success('Logged out successfully');
      navigate('/signin');
    } catch (error: unknown) {
      console.error('[AuthContext] Logout error:', error);
      // Force cleanup even if errors occur
      sessionManager.clearSession();
      secureStorage.removeItem('statsor_user');
      localStorage.removeItem('statsor_onboarding_completed');
      csrfToken.clear();
      sessionStorage.clear();
      setUser(null);
      toast.error('Logged out (with errors)');
      navigate('/signin');
    } finally {
      setLoading(false);
    }
  };

  const updateSportPreference = async (sport: 'soccer' | 'futsal') => {
    try {
      if (!user) {
        console.error('[AuthContext] No user logged in');
        return { data: null, error: 'No user logged in' };
      }

      // Get and validate session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.user) {
        console.error('[AuthContext] Session error:', sessionError);
        return { data: null, error: 'Session expired. Please sign in again.' };
      }

      const userId = sessionData.session.user.id;

      // Update in Supabase with proper error handling
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          sport: sport,
          sport_selected: true,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', userId);

      if (updateError) {
        console.error('[AuthContext] Database update error:', updateError);
        return {
          data: null,
          error: `Failed to save sport preference: ${updateError.message}`
        };
      }

      // Update local state only after successful database update
      const updatedUser: UserProfile = {
        ...user,
        sport,
        sportSelected: true,
      };
      setUser(updatedUser);
      secureStorage.setItem('statsor_user', JSON.stringify(updatedUser));

      console.log('[AuthContext] Sport preference updated successfully:', sport);
      return { data: { user: updatedUser }, error: null };

    } catch (error: unknown) {
      console.error('[AuthContext] Unexpected error in updateSportPreference:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    setIsNewUser(false);
    localStorage.setItem('statsor_onboarding_completed', 'true');
  };

  const skipOnboarding = () => {
    setHasCompletedOnboarding(true);
    setIsNewUser(false);
    localStorage.setItem('statsor_onboarding_completed', 'true');
  };

  // Alias methods for compatibility
  const login = signIn;
  const register = signUp;

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { data: null, error: 'No user logged in' };
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('statsor_user', JSON.stringify(updatedUser));
    return { data: updatedUser, error: null };
  };

  const updateUser = updateProfile;

  const resetPassword = async (email: string) => {
    // Rate limiting check for password reset
    if (!passwordResetLimiter.isAllowed('reset')) {
      toast.error('Too many password reset attempts. Please wait before trying again.');
      return { data: null, error: 'Rate limit exceeded' };
    }

    setLoading(true);
    try {
      console.log('[AuthContext] Sending password reset email to:', email);

      // Use backend API for password reset
      const response = await authAPI.forgotPassword({ email });
      
      if (response.data.success) {
        toast.success('Password reset code sent to your email!');
        return {
          data: { message: 'Password reset code sent to your email!' },
          error: null,
        };
      } else {
        const errorMsg = response.data.error || 'Failed to send password reset code';
        toast.error(errorMsg);
        return {
          data: null,
          error: errorMsg,
        };
      }
    } catch (error: unknown) {
      console.error('[AuthContext] Unexpected password reset error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Password reset failed';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isNewUser,
    hasCompletedOnboarding,
    isInitialized,
    signUp,
    signIn,
    signInWithGoogle,
    handleGoogleCallback: async () => ({ data: null, error: 'Not implemented' }),
    signOut,
    logout,
    login,
    register,
    resetPassword,
    updateProfile,
    updateUser,
    updateSportPreference,
    completeOnboarding,
    skipOnboarding,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
