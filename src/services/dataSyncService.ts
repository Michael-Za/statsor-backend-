import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SyncCallback = (data: any) => void;

class DataSyncService {
  private subscriptions: Map<string, any> = new Map();
  private callbacks: Map<string, Set<SyncCallback>> = new Map();
  private userId: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
    if (!userId) {
      this.unsubscribeAll();
    }
  }

  /**
   * Subscribe to real-time updates for a specific table
   */
  subscribe(
    table: string,
    callback: SyncCallback,
    filter?: { column: string; value: any }
  ) {
    if (!this.userId) {
      console.warn('Cannot subscribe without userId');
      return () => {};
    }

    const key = `${table}:${filter ? `${filter.column}=${filter.value}` : 'all'}`;

    // Add callback to set
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
    }
    this.callbacks.get(key)!.add(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions.has(key)) {
      const channelName = `${table}_${this.userId}_${Date.now()}`;
      
      const channel = supabase.channel(channelName);
      
      // Subscribe to postgres changes
      channel.on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
        } as any,
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleChange(key, payload);
        }
      );

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${table}`);
          toast.error(`Failed to sync ${table} data`);
        }
      });

      this.subscriptions.set(key, channel);
    }

    // Return unsubscribe function
    return () => {
      const callbackSet = this.callbacks.get(key);
      if (callbackSet) {
        callbackSet.delete(callback);
        if (callbackSet.size === 0) {
          this.unsubscribe(key);
        }
      }
    };
  }

  private handleChange(key: string, payload: any) {
    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in sync callback:', error);
        }
      });
    }
  }

  private unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      this.callbacks.delete(key);
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.callbacks.clear();
  }

  /**
   * Subscribe to player changes
   */
  subscribeToPlayers(callback: SyncCallback) {
    if (!this.userId) return () => {};
    return this.subscribe('players', callback, {
      column: 'user_id',
      value: this.userId,
    });
  }

  /**
   * Subscribe to match changes
   */
  subscribeToMatches(callback: SyncCallback) {
    if (!this.userId) return () => {};
    return this.subscribe('matches', callback, {
      column: 'user_id',
      value: this.userId,
    });
  }

  /**
   * Subscribe to team changes
   */
  subscribeToTeams(callback: SyncCallback) {
    if (!this.userId) return () => {};
    return this.subscribe('teams', callback, {
      column: 'user_id',
      value: this.userId,
    });
  }

  /**
   * Sync data across all tabs/windows
   */
  broadcastChange(table: string, action: 'create' | 'update' | 'delete', data: any) {
    const channel = new BroadcastChannel(`statsor_${table}`);
    channel.postMessage({ action, data, timestamp: Date.now() });
    channel.close();
  }

  /**
   * Listen for changes from other tabs/windows
   */
  listenToBroadcast(
    table: string,
    callback: (action: string, data: any) => void
  ) {
    const channel = new BroadcastChannel(`statsor_${table}`);
    channel.onmessage = (event) => {
      callback(event.data.action, event.data.data);
    };
    return () => channel.close();
  }
}

export const dataSyncService = new DataSyncService();
