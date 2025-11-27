import axios from 'axios';
import { toast } from 'sonner';
import { supabase } from './supabase';

// Define the AuthAPI interface to include all methods
interface AuthAPI {
  register: (data: any) => Promise<any>;
  login: (data: any) => Promise<any>;
  verifyGoogleToken: (code: string, codeVerifier: string) => Promise<any>;
  updateSportPreference: (sport: string) => Promise<any>;
  forgotPassword: (data: { email: string }) => Promise<any>;
  verifyResetCode: (data: { email: string; code: string }) => Promise<any>;
  resetPassword: (data: {
    email: string;
    code: string;
    password: string;
  }) => Promise<any>;
  logout: (data?: { csrfToken?: string }) => Promise<any>;
  validateToken: (data: { token: string }) => Promise<any>;
  refreshToken: (data: { token: string }) => Promise<any>;
}

// API Configuration - use production URL in production, localhost in development
const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction
  ? import.meta.env.VITE_API_URL || 'https://api.statsor.com/api/v1'
  : import.meta.env.VITE_API_URL || 'http://localhost:3003';

export const api = {
  baseURL: API_BASE_URL,

  // Auth endpoints
  auth: {
    register: `${API_BASE_URL}/api/v1/auth/register`,
    login: `${API_BASE_URL}/api/v1/auth/login`,
    google: `${API_BASE_URL}/api/v1/auth/google`,
    logout: `${API_BASE_URL}/api/v1/auth/logout`,
    me: `${API_BASE_URL}/api/v1/auth/me`,
    forgotPassword: `${API_BASE_URL}/api/v1/auth/forgot-password`,
    verifyResetCode: `${API_BASE_URL}/api/v1/auth/verify-reset-code`,
    resetPassword: `${API_BASE_URL}/api/v1/auth/reset-password`,

    validateToken: `${API_BASE_URL}/api/v1/auth/validate-token`,
    refreshToken: `${API_BASE_URL}/api/v1/auth/refresh-token`,
  },

  // Teams endpoints
  teams: {
    list: `${API_BASE_URL}/api/v1/teams`,
    create: `${API_BASE_URL}/api/v1/teams`,
    get: (id: string) => `${API_BASE_URL}/api/v1/teams/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/v1/teams/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/teams/${id}`,
    players: (id: string) => `${API_BASE_URL}/api/v1/teams/${id}/players`,
  },

  // Players endpoints
  players: {
    list: `${API_BASE_URL}/api/v1/players`,
    create: `${API_BASE_URL}/api/v1/players`,
    get: (id: string) => `${API_BASE_URL}/api/v1/players/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/v1/players/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/players/${id}`,
    stats: (id: string) => `${API_BASE_URL}/api/v1/players/${id}/stats`,
  },

  // Matches endpoints
  matches: {
    list: `${API_BASE_URL}/api/v1/matches`,
    create: `${API_BASE_URL}/api/v1/matches`,
    get: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}`,
    stats: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}/stats`,
    events: (id: string) => `${API_BASE_URL}/api/v1/matches/${id}/events`,
  },

  // Chatbot endpoints
  chatbot: {
    chat: `${API_BASE_URL}/api/v1/chatbot/chat`,
    history: `${API_BASE_URL}/api/v1/chatbot/history`,
    suggestions: `${API_BASE_URL}/api/v1/chatbot/suggestions`,
    clear: `${API_BASE_URL}/api/v1/chatbot/clear`,
  },

  // Analytics endpoints
  analytics: {
    dashboard: `${API_BASE_URL}/api/v1/analytics/dashboard`,
    team: (id: string) => `${API_BASE_URL}/api/v1/analytics/team/${id}`,
    player: (id: string) => `${API_BASE_URL}/api/v1/analytics/player/${id}`,
    matches: `${API_BASE_URL}/api/v1/analytics/matches`,
    export: `${API_BASE_URL}/api/v1/analytics/export`,
  },

  // Upload endpoints
  upload: {
    image: `${API_BASE_URL}/api/v1/upload/image`,
    document: `${API_BASE_URL}/api/v1/upload/document`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/upload/${id}`,
  },

  // Subscription endpoints
  subscription: {
    plans: `${API_BASE_URL}/api/v1/subscriptions/plans`,
    create: `${API_BASE_URL}/api/v1/subscriptions/create`,
    current: `${API_BASE_URL}/api/v1/subscriptions/current`,
    cancel: `${API_BASE_URL}/api/v1/subscriptions/cancel`,
    upgrade: `${API_BASE_URL}/api/v1/subscriptions/upgrade`,
  },

  // Health check
  health: `${API_BASE_URL}/api/v1/health`,

  // AI Chat endpoints
  aiChat: {
    messages: `${API_BASE_URL}/api/v1/aichat/messages`,
    history: `${API_BASE_URL}/api/v1/aichat/history`,
  },
};

// Auth API functions
export const authAPI: AuthAPI = {
  register: async (data: any) => {
    try {
      console.log('[API] Register request to:', api.auth.register);
      console.log('[API] Register data:', { ...data, password: '***' });

      const response = await axios.post(api.auth.register, data, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      console.log('[API] Register response status:', response.status);
      console.log('[API] Register response data:', response.data);

      // Check if response indicates success
      if (response.status >= 200 && response.status < 300) {
        const authData = response.data;

        // Backend returns: { message, user, tokens: { accessToken, refreshToken } }
        // Convert to expected format
        return {
          data: {
            success: true,
            data: {
              user: authData.user,
              session: authData.tokens ? {
                access_token: authData.tokens.accessToken,
                refresh_token: authData.tokens.refreshToken
              } : null,
            },
            message: authData.message || 'Registration successful!',
          },
        };
      } else {
        // Handle error response
        const errorMessage = response.data?.error?.message || 
                            response.data?.error ||
                            response.data?.message ||
                            `Registration failed with status ${response.status}`;
        return {
          data: {
            success: false,
            error: errorMessage,
            message: 'Registration failed',
          },
        };
      }
    } catch (error: any) {
      console.error('[API] Registration exception:', error);
      
      // Handle network errors specifically
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        const apiUrl = api.auth.register;
        return {
          data: {
            success: false,
            error: `Cannot connect to server at ${apiUrl}. Please make sure the backend server is running.`,
            message: 'Network Error - Backend server not reachable',
          },
        };
      }
      
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        return {
          data: {
            success: false,
            error: 'Request timed out. Please check your internet connection and try again.',
            message: 'Request Timeout',
          },
        };
      }

      const errorMessage = error?.response?.data?.error?.message || 
                          error?.response?.data?.error ||
                          error?.response?.data?.message ||
                          error.message ||
                          'Registration failed';
      return {
        data: {
          success: false,
          error: errorMessage,
          message: 'Registration failed',
        },
      };
    }
  },

  login: async (data: any) => {
    try {
      console.log('[API] Login request to:', api.auth.login);
      console.log('[API] Login data:', { email: data.email, password: '***' });

      const response = await axios.post(api.auth.login, data, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      console.log('[API] Login response status:', response.status);
      console.log('[API] Login response data:', response.data);

      // Check if response indicates success
      if (response.status >= 200 && response.status < 300) {
        const authData = response.data;

        // Backend returns: { message, user, tokens: { accessToken, refreshToken } }
        // Convert to expected format
        return {
          data: {
            success: true,
            data: {
              user: authData.user,
              session: authData.tokens ? {
                access_token: authData.tokens.accessToken,
                refresh_token: authData.tokens.refreshToken
              } : null,
            },
            message: authData.message || 'Login successful',
          },
        };
      } else {
        // Handle error response
        const errorMessage = response.data?.error?.message ||
                            response.data?.error ||
                            response.data?.message ||
                            `Login failed with status ${response.status}`;
        return {
          data: {
            success: false,
            error: errorMessage,
            message: 'Login failed',
          },
        };
      }
    } catch (error: any) {
      console.error('[API] Login exception:', error);
      
      // Handle network errors specifically
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        const apiUrl = api.auth.login;
        return {
          data: {
            success: false,
            error: `Cannot connect to server at ${apiUrl}. Please make sure the backend server is running.`,
            message: 'Network Error - Backend server not reachable',
          },
        };
      }
      
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        return {
          data: {
            success: false,
            error: 'Request timed out. Please check your internet connection and try again.',
            message: 'Request Timeout',
          },
        };
      }

      const errorMessage = error?.response?.data?.error?.message ||
                          error?.response?.data?.error ||
                          error?.response?.data?.message ||
                          error.message ||
                          'Login failed';
      return {
        data: {
          success: false,
          error: errorMessage,
          message: 'Login failed',
        },
      };
    }
  },

  verifyGoogleToken: async (code: string, codeVerifier: string) => {
    try {
      // This function should not be called when using backend OAuth flow
      // The backend handles the OAuth flow and redirects back to frontend with tokens
      // If we get here, it means there's a configuration issue
      console.error('verifyGoogleToken called unexpectedly in backend OAuth flow');
      return {
        data: {
          success: false,
          message: 'Authentication flow error. Please try again.',
          error: 'Misconfigured authentication flow',
        },
      };
    } catch (error: any) {
      console.error('Google token verification exception:', error);
      return {
        data: {
          success: false,
          message: error.message || 'Google authentication failed',
          error: error.message || 'Unknown error',
        },
      };
    }
  },

  updateSportPreference: async (sport: string) => {
    // Mock implementation that always succeeds
    await new Promise(resolve => setTimeout(resolve, 300)); // Shorter delay

    // Update user in localStorage
    const savedUser = localStorage.getItem('statsor_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      user.sport = sport;
      user.sportSelected = true;
      localStorage.setItem('statsor_user', JSON.stringify(user));
    }

    return {
      data: {
        success: true,
        data: { sport },
        message: 'Sport preference updated successfully',
      },
    };
  },

  forgotPassword: async (data: { email: string }) => {
    try {
      const response = await axios.post(api.auth.forgotPassword, data);
      const result = response.data;

      console.log(result);

      return {
        data: {
          success: true,
          data: result,
          message:
            result.message ||
            'Reset code has been sent to your email.',
        },
        error: null,
      };
    } catch (error: any) {
      console.log(error);
      const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.error || error?.response?.data?.message || error.message || 'Failed to send reset email';
      return {
        data: null,
        error: errorMessage,
      };
    }
  },

  verifyResetCode: async (data: { email: string; code: string }) => {
    try {
      const response = await axios.post(api.auth.verifyResetCode, data);
      const result = response.data;

      return {
        data: {
          valid: result.valid || true,
          message:
            result?.data?.message ||
            result.message ||
            'Reset code verified successfully',
        },
        error: null,
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.error || error?.response?.data?.message || error.message || 'Invalid or expired reset code';
      return {
        data: { valid: false },
        error: errorMessage,
      };
    }
  },

  resetPassword: async (data: {
    email: string;
    code: string;
    password: string;
  }) => {
    try {
      const response = await axios.post(api.auth.resetPassword, data);
      const result = response.data;

      return {
        data: {
          success: true,
          message: result.message || 'Password reset successful',
        },
        error: null,
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.error || error?.response?.data?.message || error.message || 'Failed to reset password. Please try again.';
      return {
        data: null,
        error: errorMessage,
      };
    }
  },

  logout: async (data?: { csrfToken?: string }) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (data?.csrfToken) {
        headers['X-CSRF-Token'] = data.csrfToken;
      }

      const response = await axios.post(api.auth.logout, {}, { headers, withCredentials: true });

      const result = response.data;

      return result;
    } catch (error) {
      console.warn('Logout API error:', error);
      return { success: true }; // Always succeed locally
    }
  },

  // Token validation method
  validateToken: async (data: { token: string }) => {
    try {
      const response = await axios.post(api.auth.validateToken, data);

      const result = response.data;


      return result;
    } catch (error) {
      console.error('Token validation error:', error);
      return { data: { valid: false } };
    }
  },

  // Token refresh method
  refreshToken: async (data: { token: string }) => {
    try {
      const response = await axios.post(api.auth.refreshToken, data);

      const result = response.data;

      return result;
    } catch (error) {
      console.error('Token refresh error:', error);
      return { data: { token: null } };
    }
  },
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: async (message: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));


      alert("Message: " + message);

      // In a real implementation, this would call your chatbot backend
      console.log('Chat message would be sent:', message);

      // Return mock response
      return {
        data: {
          success: true,
          data: {
            response:
              'This is a mock response from the AI assistant. In a real deployment, this would connect to your AI service.',
            suggestions: [
              'Try asking about player statistics',
              'Ask about team performance',
              'Request match analysis',
            ],
          },
        },
      };
    } catch (error) {
      console.error('Chat API error:', error);
      // Provide helpful fallback response
      return {
        data: {
          success: false,
          error:
            'AI chat service is currently unavailable. Please try again later.',
          data: {
            response:
              'I apologize, but the AI chat service is temporarily unavailable. Please try again in a few moments.',
            suggestions: [
              'Check your internet connection',
              'Try refreshing the page',
              'Contact support if the issue persists',
            ],
          },
        },
      };
    }
  },
};

export default api;
