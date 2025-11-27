import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authAPI } from '../../lib/api/api'
import { supabase } from '../../lib/database/supabase'
import { csrfToken, rateLimiter, secureStorage } from '../../utils/auth/security'

// PKCE utility functions for enhanced OAuth security
const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const generateRandomState = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

// Security rate limiters
const authRateLimiter = rateLimiter.create(5, 60000); // 5 attempts per minute
const passwordResetLimiter = rateLimiter.create(3, 300000); // 3 attempts per 5 minutes

interface UserProfile {
  id: string
  email: string
  name: string
  picture?: string | undefined
  avatar?: string | undefined
  given_name?: string | undefined
  family_name?: string | undefined
  locale?: string | undefined
  verified_email?: boolean | undefined
  created_at?: string | undefined
  location?: string | undefined
  provider: 'google' | 'email'
  sport?: 'soccer' | 'futsal' | undefined
  sportSelected?: boolean | undefined
  display_name?: string | undefined
  phone?: string | undefined
  bio?: string | undefined
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  isNewUser: boolean
  hasCompletedOnboarding: boolean
  isInitialized: boolean
  setUser: (user: UserProfile | null) => void
  signUp: (email: string, password: string, additionalData?: any) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
  handleGoogleCallback: (token: string) => Promise<any>
  signOut: () => Promise<any>
  logout: () => Promise<any>
  updateSportPreference: (sport: 'soccer' | 'futsal') => Promise<any>
  completeOnboarding: () => void
  skipOnboarding: () => void
  login: (email: string, password: string) => Promise<any>
  register: (email: string, password: string, additionalData?: any) => Promise<any>
  resetPassword?: (email: string) => Promise<any>
  verifyResetCode?: (email: string, code: string) => Promise<any>
  resetPasswordWithCode?: (email: string, code: string, newPassword: string) => Promise<any>
  updateProfile?: (data: Partial<UserProfile>) => Promise<any>
  updateUser?: (data: Partial<UserProfile>) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { useAuth };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const navigate = useNavigate()

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
        // Check if mock auth is enabled
        const enableMockAuth = import.meta.env['VITE_ENABLE_MOCK_AUTH'] === 'true';
        
        // If mock auth is disabled, clear any demo authentication data
        if (!enableMockAuth) {
          // Check if current user is a demo user
          const userProfile = localStorage.getItem('statsor_user');
          if (userProfile) {
            const parsedUser = JSON.parse(userProfile);
            if (parsedUser.provider === 'demo') {
              // Clear demo authentication data
              localStorage.removeItem('auth_token');
              localStorage.removeItem('statsor_user');
              localStorage.removeItem('statsor_onboarding_completed');
              localStorage.removeItem('user_type');
              localStorage.removeItem('demo_account_data');
              sessionStorage.clear();
              csrfToken.clear();
            }
          }
        }
        
        const token = secureStorage.getItem('auth_token');
        const userProfile = secureStorage.getItem('statsor_user');
        const onboardingStatus = localStorage.getItem('statsor_onboarding_completed');
        
        // Set initialized immediately to make context available
        setIsInitialized(true);
        
        if (token && userProfile) {
          // Set user immediately from stored data
          const parsedUser = JSON.parse(userProfile);
          setUser(parsedUser);
          setHasCompletedOnboarding(onboardingStatus === 'true');
          
          // Generate new CSRF token for the session
          const csrf = csrfToken.generate();
          csrfToken.store(csrf);
          
          // Validate session in background (non-blocking)
          validateSession().then(isValidSession => {
            if (!isValidSession) {
              // Try to refresh token in background
              refreshToken().then(refreshed => {
                if (!refreshed) {
                  // Force logout if refresh fails
                  logout();
                }
              }).catch(error => {
                console.error('Token refresh failed:', error);
                logout();
              });
            }
          }).catch(error => {
            console.error('Session validation failed:', error);
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('statsor_user');
        localStorage.removeItem('statsor_onboarding_completed');
        localStorage.removeItem('user_type');
        localStorage.removeItem('demo_account_data');
        csrfToken.clear();
        setIsInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up periodic session validation (every 15 minutes) - separate effect
  useEffect(() => {
    if (!user || !isInitialized) return;
    
    const sessionCheckInterval = setInterval(async () => {
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
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(sessionCheckInterval);
  }, [user, isInitialized])

  const signUp = async (email: string, password: string, additionalData?: any) => {
    if (loading || isSigningIn) {
      toast.error('Please wait, authentication in progress...')
      return { data: null, error: 'Authentication in progress' }
    }

    // Rate limiting check
    if (!authRateLimiter.isAllowed('signup')) {
      toast.error('Too many signup attempts. Please wait before trying again.')
      return { data: null, error: 'Rate limit exceeded' }
    }

    setIsSigningIn(true)
    setLoading(true)
    try {
      console.log('[AuthContext] Initiating email signup for:', email)
      // Generate and include CSRF token
      const csrf = csrfToken.generate()
      csrfToken.store(csrf)

      console.log({
        email,
        password,
        confirmPassword: additionalData?.confirmPassword || password,
        name: additionalData?.name || email.split('@')[0],
        location: additionalData?.location || '',
        csrfToken: csrf,
      });

      const response = await authAPI.register({
        email,
        password,
        confirmPassword: additionalData?.confirmPassword || password,
        name: additionalData?.name || email.split('@')[0],
        location: additionalData?.location || '',
        csrfToken: csrf
      })

      console.log('[AuthContext] Signup API response:', response.data)

      if (response.data.success) {
        const { user, session } = response.data.data
        const userProfile = {
          id: user?.id || 'user_' + Date.now(),
          email: user?.email || email,
          name: additionalData?.name || user?.user_metadata?.name || email.split('@')[0],
          provider: 'email' as const,
          sportSelected: false,
          created_at: new Date().toISOString(),
          location: additionalData?.location || ''
        }
        setUser(userProfile)
        setIsNewUser(true)
        setHasCompletedOnboarding(false)

        // Secure token storage
        secureStorage.setItem('auth_token', session?.access_token || 'token_' + Date.now())
        secureStorage.setItem('statsor_user', JSON.stringify(userProfile))
        localStorage.removeItem('statsor_onboarding_completed')
        console.log('[AuthContext] Signup successful, user profile created')
        return { data: { user: userProfile }, error: null }
      }
      console.error('[AuthContext] Signup failed:', response.data.error || response.data.message)
      return { data: null, error: response.data.error || response.data.message || 'Registration failed' }
    } catch (error: any) {
      console.error('[AuthContext] Unexpected signup error:', error)
      return { data: null, error: error.message || 'Network error during registration. Please check your connection.' }
    } finally {
      setLoading(false)
      setIsSigningIn(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (loading || isSigningIn) {
      toast.error('Please wait, authentication in progress...')
      return { data: null, error: 'Authentication in progress' }
    }

    // Rate limiting check
    if (!authRateLimiter.isAllowed('signin')) {
      toast.error('Too many login attempts. Please wait before trying again.')
      return { data: null, error: 'Rate limit exceeded' }
    }

    setIsSigningIn(true)
    setLoading(true)
    try {
      console.log('[AuthContext] Initiating email signin for:', email)
      // Generate and include CSRF token
      const csrf = csrfToken.generate()
      csrfToken.store(csrf)

      const response = await authAPI.login({
        email,
        password,
        csrfToken: csrf
      })

      console.log('[AuthContext] Signin API response:', response.data)

      if (response.data.success) {
        const { user, session } = response.data.data
        const userProfile = {
          id: user?.id || 'user_' + Date.now(),
          email: user?.email || email,
          name: user?.name || user?.user_metadata?.name || email.split('@')[0],
          provider: 'email' as const,
          sportSelected: user?.sportSelected || false,
          created_at: user?.created_at || new Date().toISOString(),
          location: user?.location || ''
        }
        setUser(userProfile)
        setIsNewUser(false)
        const onboardingStatus = localStorage.getItem('statsor_onboarding_completed')
        setHasCompletedOnboarding(onboardingStatus === 'true')

        // Secure token storage
        secureStorage.setItem('auth_token', session?.access_token || 'token_' + Date.now())
        secureStorage.setItem('statsor_user', JSON.stringify(userProfile))
        console.log('[AuthContext] Signin successful, user profile loaded')
        return { data: { user: userProfile }, error: null }
      }
      console.error('[AuthContext] Signin failed:', response.data.error || response.data.message)
      return { data: null, error: response.data.error || response.data.message || 'Login failed' }
    } catch (error: any) {
      console.error('[AuthContext] Unexpected signin error:', error)
      return { data: null, error: 'Network error during login. Please check your connection.' }
    } finally {
      setLoading(false)
      setIsSigningIn(false)
    }
  }

  const signInWithGoogle = async () => {
    if (loading || isSigningIn) {
      toast.error('Please wait, authentication in progress...')
      return { data: null, error: 'Authentication in progress' }
    }

    setIsSigningIn(true)
    setLoading(true)

    try {
      // Use Supabase Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://statsor.com/google-callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }

      // Supabase handles the redirect automatically
      return { data: null, error: null };

    } catch (error: any) {
      console.error('Google auth error:', error);
      const errorMessage = error?.message || 'Google authentication failed. Please check your internet connection and try again.';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setIsSigningIn(false)
      setLoading(false)
    }
  }

  const handleGoogleCallback = async () => {
    try {
      setLoading(true);
      
      // Get the current Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (session) {
        // Extract user information from Supabase session
        const supabaseUser = session.user;
        
        // Create user profile from Supabase user
        const userProfile: UserProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
          picture: supabaseUser.user_metadata?.picture || '',
          provider: 'google',
          sportSelected: false, // This would need to be fetched from your database
          created_at: supabaseUser.created_at
        };
        
        setUser(userProfile);
        setIsNewUser(false); // Assume existing user for now
        setHasCompletedOnboarding(false); // This would need to be fetched from your database
        
        // Store session data
        localStorage.setItem('auth_token', session.access_token);
        localStorage.setItem('statsor_user', JSON.stringify(userProfile));
        
        toast.success('Welcome! Google authentication successful.');
        
        // Navigate to dashboard
        navigate('/dashboard');
        
        return { data: { user: userProfile }, error: null };
      } else {
        const error = 'No session found after Google authentication';
        toast.error(error);
        return { data: null, error };
      }
      
    } catch (error: any) {
      console.error('Google callback error:', error);
      const errorMessage = error?.message || 'Google authentication failed';
      toast.error(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      // Include CSRF token for secure logout
      const csrf = csrfToken.get();
      
      // Call logout API with CSRF protection
      try {
        await authAPI.logout({ csrfToken: csrf || '' });
        console.log('User logged out successfully');
      } catch (apiError) {
        console.warn('Logout API call failed, but local session cleared:', apiError);
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
      
      setUser(null)
      setIsNewUser(false)
      setHasCompletedOnboarding(false)
      
      toast.success('Logged out successfully');
      navigate('/signin');
      return { error: null }
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force cleanup even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('statsor_user');
      csrfToken.clear();
      sessionStorage.clear();
      setUser(null);
      toast.error('Logged out (with errors)');
      navigate('/signin');
      return { error: error.message };
    } finally {
      setIsSigningIn(false)
      setLoading(false)
    }
  }

  const updateSportPreference = async (sport: 'soccer' | 'futsal') => {
    try {
      // Check if this is a demo account
      const isDemo = localStorage.getItem('user_type') === 'demo';
      
      if (isDemo) {
        // For demo accounts, update localStorage directly
        if (user) {
          const updatedUser: UserProfile = { 
            ...user, 
            sport, 
            sportSelected: true 
          }
          setUser(updatedUser)
          localStorage.setItem('statsor_user', JSON.stringify(updatedUser))
          
          // Also update sport context
          localStorage.setItem('statsor_sport', sport);
          localStorage.setItem('statsor_sport_selection_completed', 'true');
          
          return { data: { user: updatedUser }, error: null }
        }
      } else {
        // For real accounts, use the API
        const response = await authAPI.updateSportPreference(sport)
        if (response.data.success) {
          if (user) {
            const updatedUser: UserProfile = { 
              ...user, 
              sport, 
              sportSelected: true 
            }
            setUser(updatedUser)
            localStorage.setItem('statsor_user', JSON.stringify(updatedUser))
            return { data: { user: updatedUser }, error: null }
          }
        }
        return { data: null, error: response.data.message }
      }
    } catch (error: any) {
      console.error('Update sport preference error:', error);
      return { data: null, error: error.message }
    }
  }
  
  const completeOnboarding = () => {
    setHasCompletedOnboarding(true)
    setIsNewUser(false)
    localStorage.setItem('statsor_onboarding_completed', 'true')
  }

  const skipOnboarding = () => {
    setHasCompletedOnboarding(true)
    setIsNewUser(false)
    localStorage.setItem('statsor_onboarding_completed', 'true')
  }

  // Enhanced logout function with secure cleanup
  const logout = async () => {
    setLoading(true);
    try {
      // Include CSRF token for secure logout
      const csrf = csrfToken.get();
      await authAPI.logout({ csrfToken: csrf || '' });
      
      // Secure cleanup of all stored data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('statsor_user');
      localStorage.removeItem('statsor_onboarding_completed');
      
      // Clear CSRF token and session data
      csrfToken.clear();
      sessionStorage.clear();
      
      // Reset state
      setUser(null);
      setIsNewUser(false);
      setHasCompletedOnboarding(false);
      
      toast.success('Logged out successfully');
      navigate('/signin');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force cleanup even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('statsor_user');
      csrfToken.clear();
      sessionStorage.clear();
      setUser(null);
      toast.error('Logged out (with errors)');
      navigate('/signin');
    } finally {
      setLoading(false);
    }
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
      toast.error('Too many password reset attempts. Please wait before trying again.')
      return { data: null, error: 'Rate limit exceeded' }
    }

    setLoading(true);
    try {
      // Generate and include CSRF token
      const csrf = csrfToken.generate()
      csrfToken.store(csrf)

      const response = await authAPI.forgotPassword({ 
        email
      });
      if (response.data.success) {
        return { data: { message: 'Reset code sent to your email' }, error: null };
      }
      return { data: null, error: response.data.message || 'Failed to send reset code' };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { data: null, error: error.message || 'Failed to send reset code' };
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async (email: string, code: string) => {
    setLoading(true);
    try {
      const response = await authAPI.verifyResetCode({ email, code });
      if (response.data.success) {
        return { data: { valid: true }, error: null };
      }
      return { data: { valid: false }, error: response.data.message || 'Invalid reset code' };
    } catch (error: any) {
      console.error('Verify reset code error:', error);
      return { data: { valid: false }, error: error.message || 'Invalid reset code' };
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    setLoading(true);
    try {
      const response = await authAPI.resetPassword({ email, code, password: newPassword });
      if (response.data.success) {
        return { data: { message: 'Password reset successful' }, error: null };
      }
      return { data: null, error: response.data.message || 'Failed to reset password' };
    } catch (error: any) {
      console.error('Reset password with code error:', error);
      return { data: null, error: error.message || 'Failed to reset password' };
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
    handleGoogleCallback,
    signOut,
    logout,
    login,
    register,
    resetPassword,
    verifyResetCode,
    resetPasswordWithCode,
    updateProfile,
    updateUser,
    updateSportPreference,
    completeOnboarding,
    skipOnboarding,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
