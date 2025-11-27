import { toast } from 'sonner';
import axios from 'axios';
import { api } from '../lib/api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  maxTeams: number;
  maxPlayers: number;
  maxMatches: number;
  hasAdvancedAnalytics: boolean;
  hasTacticalChat: boolean;
  hasExportFeatures: boolean;
  hasPrioritySupport: boolean;
}

export interface UserSubscription {
  id: string;
  planId: string;
  status: 'free' | 'trial' | 'active' | 'cancelled' | 'expired';
  trialStartDate?: string;
  trialEndDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  teamsCreated: number;
  playersAdded: number;
  matchesPlayed: number;
  featuresUsed: {
    tacticalChat: number;
    advancedAnalytics: number;
    exportFeatures: number;
  };
}

const FREE_TRIAL_DAYS = 7;
const FREE_PLAN_LIMITS = {
  maxTeams: 1,
  maxPlayers: 10,
  maxMatches: 5,
  hasAdvancedAnalytics: false,
  hasTacticalChat: true,
  hasExportFeatures: false,
  hasPrioritySupport: false,
};

const PAID_PLAN_LIMITS = {
  maxTeams: 10,
  maxPlayers: 100,
  maxMatches: 50,
  hasAdvancedAnalytics: true,
  hasTacticalChat: true,
  hasExportFeatures: true,
  hasPrioritySupport: true,
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '1 Team',
      '10 Players',
      '5 Matches',
      'Basic Analytics',
      'Tactical Chat',
      'Community Support'
    ],
    ...FREE_PLAN_LIMITS
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '10 Teams',
      '100 Players',
      '50 Matches',
      'Advanced Analytics',
      'Tactical Chat',
      'Export Features',
      'Priority Support',
      'Custom Reports'
    ],
    ...PAID_PLAN_LIMITS
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited Teams',
      'Unlimited Players',
      'Unlimited Matches',
      'Advanced Analytics',
      'Tactical Chat',
      'Export Features',
      'Priority Support',
      'Custom Reports',
      'API Access',
      'White-label Options'
    ],
    maxTeams: -1, // Unlimited
    maxPlayers: -1, // Unlimited
    maxMatches: -1, // Unlimited
    hasAdvancedAnalytics: true,
    hasTacticalChat: true,
    hasExportFeatures: true,
    hasPrioritySupport: true,
  }
];

class SubscriptionService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Initialize user subscription (called after signup)
  async initializeUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const existingSubscription = await this.getUserSubscription(userId);
      if (existingSubscription) {
        return existingSubscription;
      }

      const response = await axios.post(
        `${api.baseURL}/api/v1/subscriptions/create`,
        { plan_id: 'free', payment_method: 'none' },
        { headers: this.getAuthHeaders() }
      );

      if (response.data?.subscription) {
        toast.success('Welcome! You have 7 days of free access to all features.');
        return response.data.subscription;
      }

      return null;
    } catch (error) {
      console.error('Error initializing subscription:', error);
      return null;
    }
  }

  // Get user subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const response = await axios.get(
        `${api.baseURL}/api/v1/subscriptions/current`,
        { headers: this.getAuthHeaders() }
      );

      return response.data?.subscription || null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  // Get usage statistics
  async getUserUsageStats(userId: string): Promise<UsageStats> {
    try {
      const response = await axios.get(
        `${api.baseURL}/api/v1/subscriptions/usage`,
        { headers: this.getAuthHeaders() }
      );

      return response.data || {
        teamsCreated: 0,
        playersAdded: 0,
        matchesPlayed: 0,
        featuresUsed: {
          tacticalChat: 0,
          advancedAnalytics: 0,
          exportFeatures: 0,
        }
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return {
        teamsCreated: 0,
        playersAdded: 0,
        matchesPlayed: 0,
        featuresUsed: {
          tacticalChat: 0,
          advancedAnalytics: 0,
          exportFeatures: 0,
        }
      };
    }
  }

  // Update usage statistics
  async updateUsageStats(userId: string, updates: Partial<UsageStats>): Promise<void> {
    // In a real implementation, this would be handled by the backend
    // For now, we'll just log the updates
    console.log('Updating usage stats:', updates);
  }

  // Check if user can access a feature
  async canAccessFeature(userId: string, feature: keyof typeof FREE_PLAN_LIMITS): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      // Check plan limits
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
      if (!plan) return false;

      return plan[feature] as boolean;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  // Check if user can create more of a resource
  async canCreateResource(userId: string, resourceType: 'teams' | 'players' | 'matches'): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
      if (!plan) return false;

      const usage = await this.getUserUsageStats(userId);
      const maxLimit = plan[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}` as keyof SubscriptionPlan] as number;

      // -1 means unlimited
      if (maxLimit === -1) return true;

      const currentCount = usage[`${resourceType}Created` as keyof UsageStats] as number;
      return currentCount < maxLimit;
    } catch (error) {
      console.error('Error checking resource creation:', error);
      return false;
    }
  }

  // Get days remaining in trial
  async getTrialDaysRemaining(userId: string): Promise<number> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription || subscription.status !== 'trial' || !subscription.trialEndDate) {
        return 0;
      }

      const trialEnd = new Date(subscription.trialEndDate);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return Math.max(0, diffDays);
    } catch (error) {
      console.error('Error calculating trial days remaining:', error);
      return 0;
    }
  }

  // Upgrade subscription
  async upgradeSubscription(userId: string, planId: string): Promise<boolean> {
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        toast.error('Invalid plan selected');
        return false;
      }

      // For real implementation, this would redirect to payment
      // For now, we'll simulate the upgrade
      const response = await axios.put(
        `${api.baseURL}/api/v1/subscriptions/upgrade`,
        { new_plan_id: planId },
        { headers: this.getAuthHeaders() }
      );

      if (response.data?.subscription) {
        toast.success(`Successfully upgraded to ${plan.name} plan!`);
        return true;
      }

      toast.error('Failed to upgrade subscription. Please try again.');
      return false;
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      const message = error.response?.data?.message || 'Failed to upgrade subscription. Please try again.';
      toast.error(message);
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${api.baseURL}/api/v1/subscriptions/cancel`,
        {},
        { headers: this.getAuthHeaders() }
      );

      if (response.data?.subscription) {
        toast.success('Subscription cancelled. You can continue using premium features until the end of your billing period.');
        return true;
      }

      toast.error('Failed to cancel subscription. Please try again.');
      return false;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      const message = error.response?.data?.message || 'Failed to cancel subscription. Please try again.';
      toast.error(message);
      return false;
    }
  }

  // Get subscription status summary
  async getSubscriptionSummary(userId: string) {
    try {
      const subscription = await this.getUserSubscription(userId);
      const usage = await this.getUserUsageStats(userId);
      const plan = subscription ? SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId) : null;
      const trialDaysRemaining = await this.getTrialDaysRemaining(userId);

      return {
        subscription,
        plan,
        usage,
        trialDaysRemaining,
        isInTrial: subscription?.status === 'trial' && trialDaysRemaining > 0,
        canAccessAdvancedFeatures: await this.canAccessFeature(userId, 'hasAdvancedAnalytics'),
        canExport: await this.canAccessFeature(userId, 'hasExportFeatures'),
        canCreateMoreTeams: await this.canCreateResource(userId, 'teams'),
        canCreateMorePlayers: await this.canCreateResource(userId, 'players'),
        canCreateMoreMatches: await this.canCreateResource(userId, 'matches'),
      };
    } catch (error) {
      console.error('Error getting subscription summary:', error);
      return {
        subscription: null,
        plan: null,
        usage: {
          teamsCreated: 0,
          playersAdded: 0,
          matchesPlayed: 0,
          featuresUsed: {
            tacticalChat: 0,
            advancedAnalytics: 0,
            exportFeatures: 0,
          }
        },
        trialDaysRemaining: 0,
        isInTrial: false,
        canAccessAdvancedFeatures: false,
        canExport: false,
        canCreateMoreTeams: false,
        canCreateMorePlayers: false,
        canCreateMoreMatches: false,
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();