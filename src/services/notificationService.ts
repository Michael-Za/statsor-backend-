import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  type: 'welcome' | 'match_created' | 'player_added' | 'system' | 'info';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  private userId: string | null = null;
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  setUserId(userId: string | null) {
    this.userId = userId;
    if (userId) {
      this.subscribeToNotifications();
    }
  }

  private subscribeToNotifications() {
    if (!this.userId) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`notifications:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          this.handleNewNotification(notification);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  private handleNewNotification(notification: Notification) {
    // Show toast notification
    toast.info(notification.title, {
      description: notification.message,
      action: notification.action_url
        ? {
            label: 'View',
            onClick: () => {
              window.location.href = notification.action_url!;
            },
          }
        : undefined,
    });

    // Notify all listeners
    this.notifyListeners();
  }

  private notifyListeners() {
    this.getNotifications().then((notifications) => {
      this.listeners.forEach((listener) => listener(notifications));
    });
  }

  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          action_url: actionUrl,
          metadata,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  async sendWelcomeNotification(userId: string): Promise<void> {
    await this.createNotification(
      userId,
      'welcome',
      'Welcome to Statsor!',
      'Get started by adding your first player to begin tracking performance.',
      '/players'
    );
  }

  async sendMatchCreatedNotification(
    userId: string,
    matchId: string,
    matchTitle: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      'match_created',
      'Match Created!',
      `${matchTitle} has been created. View your match summary.`,
      `/matches/${matchId}`
    );
  }

  async sendPlayerAddedNotification(
    userId: string,
    playerName: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      'player_added',
      'Player Added',
      `${playerName} has been successfully added to your team.`,
      '/players'
    );
  }

  async getNotifications(): Promise<Notification[]> {
    if (!this.userId) return [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    if (!this.userId) return 0;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', this.userId)
        .eq('read', false);

      if (error) throw error;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener);
    // Immediately call with current notifications
    this.getNotifications().then(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const notificationService = new NotificationService();
