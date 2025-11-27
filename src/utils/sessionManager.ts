/**
 * Session Manager - Persistent session management
 * Handles JWT tokens with automatic refresh and cross-tab synchronization
 */

import { secureStorage } from './security';
import { supabase } from '../lib/supabase';

const TOKEN_REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours before expiry
const SESSION_CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionData {
  token: string;
  refreshToken?: string | undefined;
  expiresAt: number;
  userId: string;
  profileId?: string | undefined;
}

class SessionManager {
  private checkInterval: NodeJS.Timeout | null = null;
  private refreshCallback: ((token: string) => Promise<string | null>) | null = null;
  private storageListener: ((e: StorageEvent) => void) | null = null;

  /**
   * Initialize session manager with refresh callback
   */
  initialize(refreshCallback?: (token: string) => Promise<string | null>) {
    if (refreshCallback) {
      this.refreshCallback = refreshCallback;
    }
    this.startSessionCheck();
    this.setupStorageListener();
  }

  /**
   * Save session data with persistence
   */
  saveSession(data: SessionData) {
    secureStorage.setItem('auth_token', data.token);
    if (data.refreshToken) {
      secureStorage.setItem('refresh_token', data.refreshToken);
    }
    secureStorage.setItem('token_expires_at', data.expiresAt.toString());
    secureStorage.setItem('user_id', data.userId);
    if (data.profileId) {
      secureStorage.setItem('profile_id', data.profileId);
    }
    
    // Mark user as real (not demo)
    localStorage.setItem('user_type', 'real');
    
    // Broadcast session update to other tabs
    this.broadcastSessionUpdate('save', data);
  }

  /**
   * Get current session
   */
  getSession(): SessionData | null {
    const token = secureStorage.getItem('auth_token');
    const refreshToken = secureStorage.getItem('refresh_token');
    const expiresAt = secureStorage.getItem('token_expires_at');
    const userId = secureStorage.getItem('user_id');
    const profileId = secureStorage.getItem('profile_id');

    if (!token || !userId) {
      return null;
    }

    return {
      token,
      refreshToken: refreshToken ?? undefined,
      expiresAt: expiresAt ? parseInt(expiresAt) : Date.now() + SESSION_DURATION,
      userId,
      profileId: profileId ?? undefined,
    };
  }

  /**
   * Restore session from Supabase
   */
  async restoreSession(): Promise<SessionData | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('[SessionManager] No active Supabase session');
        return null;
      }

      // Get profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      const sessionData: SessionData = {
        token: session.access_token,
        refreshToken: session.refresh_token ?? undefined,
        expiresAt: new Date(session.expires_at ?? Date.now() + SESSION_DURATION).getTime(),
        userId: session.user.id,
        profileId: profile?.id ?? undefined
      };

      this.saveSession(sessionData);
      console.log('[SessionManager] Session restored from Supabase');
      return sessionData;
    } catch (error) {
      console.error('[SessionManager] Error restoring session:', error);
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) return false;

    return Date.now() < session.expiresAt;
  }

  /**
   * Check if session needs refresh
   */
  needsRefresh(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const timeUntilExpiry = session.expiresAt - Date.now();
    return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<boolean> {
    if (!this.refreshCallback) {
      console.error('Session refresh callback not set');
      return false;
    }

    const session = this.getSession();
    if (!session || !session.refreshToken) return false;

    try {
      const newToken = await this.refreshCallback(session.refreshToken);
      if (newToken) {
        // Update token and extend expiry
        const newExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
        this.saveSession({
          ...session,
          token: newToken,
          expiresAt: newExpiresAt,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }

  /**
   * Clear session data
   */
  clearSession() {
    secureStorage.removeItem('auth_token');
    secureStorage.removeItem('refresh_token');
    secureStorage.removeItem('token_expires_at');
    secureStorage.removeItem('user_id');
    secureStorage.removeItem('profile_id');
    localStorage.removeItem('user_type');
    
    // Broadcast session clear to other tabs
    this.broadcastSessionUpdate('clear', null);
    
    this.stopSessionCheck();
    this.removeStorageListener();
  }

  /**
   * Start automatic session checking
   */
  private startSessionCheck() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(async () => {
      if (this.needsRefresh()) {
        console.log('Session needs refresh, refreshing...');
        const refreshed = await this.refreshSession();
        if (!refreshed) {
          console.error('Failed to refresh session');
          // Don't clear session immediately, let user continue until expiry
        }
      }
    }, SESSION_CHECK_INTERVAL);
  }

  /**
   * Stop automatic session checking
   */
  private stopSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get time until session expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    const session = this.getSession();
    if (!session) return 0;

    return Math.max(0, session.expiresAt - Date.now());
  }

  /**
   * Check if user has "remember me" enabled
   */
  hasRememberMe(): boolean {
    return secureStorage.getItem('remember_me') === 'true';
  }

  /**
   * Set "remember me" preference
   */
  setRememberMe(remember: boolean) {
    if (remember) {
      secureStorage.setItem('remember_me', 'true');
    } else {
      secureStorage.removeItem('remember_me');
    }
  }

  /**
   * Setup cross-tab session synchronization
   */
  private setupStorageListener() {
    if (typeof window === 'undefined') return;

    this.storageListener = (e: StorageEvent) => {
      if (e.key === 'session_update') {
        const update = e.newValue ? JSON.parse(e.newValue) : null;
        if (update?.action === 'clear') {
          // Another tab logged out, clear this tab too
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', this.storageListener);
  }

  /**
   * Remove storage listener
   */
  private removeStorageListener() {
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
  }

  /**
   * Broadcast session updates to other tabs
   */
  private broadcastSessionUpdate(action: 'save' | 'clear', data: SessionData | null) {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('session_update', JSON.stringify({
        action,
        data,
        timestamp: Date.now()
      }));
      // Remove immediately to allow future updates
      setTimeout(() => localStorage.removeItem('session_update'), 100);
    } catch (error) {
      console.error('[SessionManager] Error broadcasting session update:', error);
    }
  }

  /**
   * Validate session with Supabase
   */
  async validateWithSupabase(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return !error && !!user;
    } catch (error) {
      console.error('[SessionManager] Error validating with Supabase:', error);
      return false;
    }
  }
}

export const sessionManager = new SessionManager();
