import { toast } from 'sonner';
import { supabase } from './supabase';

// Enhanced API utility with retry logic and error handling
class APIRetryWrapper {
  private static readonly MAX_RETRIES = 5;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[API] Attempt ${attempt}/${maxRetries} for ${operationName}`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`[API] Success on attempt ${attempt} for ${operationName}`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`[API] Attempt ${attempt} failed for ${operationName}:`, error);
        
        // Don't retry on authentication errors or 4xx client errors
        if (error.response?.status >= 400 && error.response?.status < 500) {
          console.log(`[API] Client error ${error.response.status}, not retrying`);
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          console.error(`[API] All ${maxRetries} attempts failed for ${operationName}`);
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`[API] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Enhanced error handler
const handleAPIError = (error: any, operation: string) => {
  console.error(`[API Error] ${operation}:`, error);
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error || 'Server error';
    
    switch (status) {
      case 401:
        toast.error('Authentication failed. Please log in again.');
        break;
      case 403:
        toast.error('Access denied. You don\'t have permission for this action.');
        break;
      case 404:
        toast.error('The requested resource was not found.');
        break;
      case 429:
        toast.error('Too many requests. Please wait a moment and try again.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      case 502:
      case 503:
      case 504:
        toast.error('Service temporarily unavailable. Please try again later.');
        break;
      default:
        toast.error(`Error: ${message}`);
    }
    
    return { success: false, error: message, status };
  } else if (error.request) {
    // Network error (no response received)
    toast.error('Network error. Please check your internet connection.');
    return { success: false, error: 'Network error', status: 0 };
  } else {
    // Other errors
    toast.error(`Request failed: ${error.message}`);
    return { success: false, error: error.message, status: -1 };
  }
};

// Define API structure type
interface APIEndpoints {
  baseURL: string;
  auth: {
    register: string;
    login: string;
    google: string;
    logout: string;
    me: string;
    forgotPassword: string;
    verifyResetCode: string;
    resetPassword: string;
  };
  teams: {
    list: string;
    create: string;
    get: (id: string) => string;
    update: (id: string) => string;
    delete: (id: string) => string;
    players: (id: string) => string;
  };
  players: {
    list: string;
    create: string;
    get: (id: string) => string;
    update: (id: string) => string;
    delete: (id: string) => string;
    stats: (id: string) => string;
  };
  matches: {
    list: string;
    create: string;
    get: (id: string) => string;
    update: (id: string) => string;
    delete: (id: string) => string;
    stats: (id: string) => string;
    events: (id: string) => string;
  };
  chatbot: {
    chat: string;
    history: string;
    suggestions: string;
    clear: string;
  };
  analytics: {
    dashboard: string;
    team: (id: string) => string;
    player: (id: string) => string;
    matches: string;
    export: string;
  };
  upload: {
    image: string;
    document: string;
    delete: (id: string) => string;
  };
  subscription: {
    plans: string;
    create: string;
    current: string;
    cancel: string;
    upgrade: string;
  };
  health: string;
  aiChat: {
    messages: string;
    history: string;
    conversation: string;
  };
}

// Define the AuthAPI interface to include all methods
interface AuthAPI {
  register: (data: any) => Promise<any>;
  login: (data: any) => Promise<any>;
  verifyGoogleToken: (code: string, codeVerifier: string) => Promise<any>;
  updateSportPreference: (sport: string) => Promise<any>;
  forgotPassword: (data: { email: string }) => Promise<any>;
  verifyResetCode: (data: { email: string; code: string }) => Promise<any>;
  resetPassword: (data: { email: string; code: string; password: string }) => Promise<any>;
  logout: (data?: { csrfToken?: string }) => Promise<any>;
  validateToken: (data: { token: string }) => Promise<any>;
  refreshToken: (data: { token: string }) => Promise<any>;
}

// API Configuration - use Railway backend for API calls
const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction 
  ? 'https://web-production-22b3d.up.railway.app'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

export const api: APIEndpoints = {
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
    conversation: `${API_BASE_URL}/api/v1/aichat/conversation`,
  },
};

export const authAPI: AuthAPI = {
  register: async (data: any) => {
    return await APIRetryWrapper.withRetry(async () => {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
              location: data.location,
            }
          }
        });

        if (error) {
          console.error('Registration error:', error);
          throw error;
        }

        return {
          data: {
            success: true,
            data: {
              user: authData.user,
              session: authData.session
            },
            message: 'Registration successful!'
          }
        };
      } catch (error: any) {
        console.error('Registration exception:', error);
        return {
          data: {
            success: false,
            error: error.message,
            message: error.message || 'Registration failed'
          }
        };
      }
    }, 'User Registration');
  },
  
  login: async (data: any) => {
    return await APIRetryWrapper.withRetry(async () => {
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });

        if (error) {
          console.error('Login error:', error);
          throw error;
        }

        return {
          data: {
            success: true,
            data: {
              user: authData.user,
              session: authData.session
            },
            message: 'Login successful'
          }
        };
      } catch (error: any) {
        console.error('Login exception:', error);
        return {
          data: {
            success: false,
            error: error.message,
            message: error.message || 'Login failed'
          }
        };
      }
    }, 'User Login');
  },
  
  verifyGoogleToken: async (code: string, codeVerifier: string) => {
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;

      const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Google OAuth error:', error);
        return {
          data: {
            success: false,
            message: error.message || 'Google authentication failed',
            error: error.message || 'Unknown error'
          }
        };
      }

      return {
        data: {
          success: true,
          data: {
            user: authData.user,
            token: authData.session?.access_token
          }
        }
      };
    } catch (error: any) {
      console.error('Google token verification exception:', error);
      return {
        data: {
          success: false,
          message: error.message || 'Google authentication failed',
          error: error.message || 'Unknown error'
        }
      };
    }
  },
  
  updateSportPreference: async (sport: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
        message: 'Sport preference updated successfully'
      }
    };
  },

  forgotPassword: async (data: { email: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      const result = await response.json();
      return {
        data: {
          success: true,
          data: result,
          message: result.message || 'If the email exists, a reset link has been sent.'
        }
      };
    } catch (error: any) {
      return {
        data: {
          success: false,
          error: error.message,
          message: 'Failed to send reset email'
        }
      };
    }
  },

  verifyResetCode: async (data: { email: string; code: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid reset code');
      }

      const result = await response.json();
      return {
        data: {
          success: true,
          data: result,
          message: result.message || 'Reset code verified successfully'
        }
      };
    } catch (error: any) {
      return {
        data: {
          success: false,
          error: error.message,
          message: 'Invalid or expired reset code'
        }
      };
    }
  },

  resetPassword: async (data: { email: string; code: string; password: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const result = await response.json();
      return {
        data: {
          success: true,
          data: result,
          message: result.message || 'Password reset successful'
        }
      };
    } catch (error: any) {
      return {
        data: {
          success: false,
          error: error.message,
          message: 'Failed to reset password. Please try again.'
        }
      };
    }
  },
  
  logout: async (data?: { csrfToken?: string }) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (data?.csrfToken) {
        headers['X-CSRF-Token'] = data.csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken: localStorage.getItem('refresh_token') })
      });

      if (!response.ok) {
        console.warn('Logout API call failed, but proceeding with local logout');
      }

      return { success: true };
    } catch (error) {
      console.warn('Logout API error:', error);
      return { success: true }; // Always succeed locally
    }
  },
  
  // Token validation method
  validateToken: async (data: { token: string }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, this would validate with your backend
      console.log('Token validation would happen here');
      
      return { data: { valid: true } };
    } catch (error) {
      console.error('Token validation error:', error);
      return { data: { valid: false } };
    }
  },
  
  // Token refresh method
  refreshToken: async (data: { token: string }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, this would refresh with your backend
      console.log('Token refresh would happen here');
      
      return { data: { token: 'new_mock_token_' + Date.now() } };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { data: { token: null } };
    }
  }
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: async (message: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would call your chatbot backend
      console.log('Chat message would be sent:', message);
      
      // Return mock response
      return {
        data: {
          success: true,
          data: {
            response: "This is a mock response from the AI assistant. In a real deployment, this would connect to your AI service.",
            suggestions: ["Try asking about player statistics", "Ask about team performance", "Request match analysis"]
          }
        }
      };
    } catch (error) {
      console.error('Chat API error:', error);
      // Provide helpful fallback response
      return {
        data: {
          success: false,
          error: 'AI chat service is currently unavailable. Please try again later.',
          data: {
            response: 'I apologize, but the AI chat service is temporarily unavailable. Please try again in a few moments.',
            suggestions: ['Check your internet connection', 'Try refreshing the page', 'Contact support if the issue persists']
          }
        }
      };
    }
  }
};

export default api;