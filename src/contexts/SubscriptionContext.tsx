import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxTeams: number;
  maxPlayers: number;
  aiAccess: boolean;
  aiRequestsPerDay: number; // -1 for unlimited
  priority: boolean;
  popular?: boolean;
  description: string;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
}

interface SubscriptionContextType {
  plans: Plan[];
  currentPlan: Plan | null;
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  loading: boolean;
  subscribe: (planId: string, paymentMethodId?: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  updatePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  addPaymentMethod: (paymentData: any) => Promise<boolean>;
  removePaymentMethod: (paymentMethodId: string) => Promise<boolean>;
  getPlanFeatures: (planId: string) => Plan | null;
  hasFeature: (feature: string) => boolean;
  canCreateTeam: () => boolean;
  canAddPlayer: (currentCount: number) => boolean;
  canUseAI: () => boolean;
  getAIRequestsRemaining: () => number;
  incrementAIUsage: () => boolean;
  getUsageStats: () => { teams: number; players: number; aiUsage: number; aiRequestsToday: number; aiRequestsRemaining: number };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

const defaultPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'EUR',
    interval: 'monthly',
    description: 'Perfect for trying out the platform',
    features: [
      '1 team',
      'Track up to 15 players',
      '10 AI Assistant requests per day',
      'Basic match tracking',
      'Manual data entry',
      'Basic performance statistics',
      'Football & Futsal support',
      'CSV export',
      '30 days data retention',
      'Community support'
    ],
    maxTeams: 1,
    maxPlayers: 15,
    aiAccess: true,
    aiRequestsPerDay: 10,
    priority: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 90,
    currency: 'EUR',
    interval: 'yearly',
    description: 'For serious coaches and teams',
    features: [
      '1 team',
      'Unlimited players',
      '50 AI Assistant requests per day',
      'Player profile pictures',
      'AI-powered Tactical Assistant',
      'Advanced match analytics dashboard',
      'Real-time match tracking',
      'Training session planner',
      'Player performance insights',
      'Football & Futsal support',
      'Interactive tactical board',
      'PDF & Excel exports',
      'Unlimited data retention',
      'Priority email support (24h response)'
    ],
    maxTeams: 1,
    maxPlayers: -1,
    aiAccess: true,
    aiRequestsPerDay: 50,
    priority: false,
    popular: true
  },
  {
    id: 'pro_plus',
    name: 'Pro Plus',
    price: 0,
    currency: 'EUR',
    interval: 'monthly',
    description: 'Enterprise-grade solutions',
    features: [
      'Everything in Pro',
      'Custom team configurations',
      'Unlimited AI Assistant requests',
      'Advanced AI coaching insights',
      'Custom tactical analysis',
      'White-label branding options',
      'API access for integrations',
      'Dedicated account manager',
      'Custom feature development',
      'Unlimited data retention',
      'On-site training sessions',
      'Priority phone & email support',
      'Custom reporting and analytics'
    ],
    maxTeams: 1,
    maxPlayers: -1,
    aiAccess: true,
    aiRequestsPerDay: -1,
    priority: true
  }
];

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plans] = useState<Plan[]>(defaultPlans);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const getFreePlan = (): Plan => {
    const freePlan = plans[0] || defaultPlans[0];
    if (!freePlan) {
      throw new Error('No free plan available');
    }
    return freePlan;
  };

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      console.log('[Subscription] Loading subscription data');
      
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[Subscription] No authenticated user - defaulting to free');
        setCurrentPlan(getFreePlan());
        setLoading(false);
        return;
      }

      console.log('[Subscription] User authenticated:', user.id);

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('[Subscription] Profile error:', profileError);
        console.log('[Subscription] No profile found - defaulting to free');
        setCurrentPlan(getFreePlan());
        setLoading(false);
        return;
      }

      console.log('[Subscription] Profile found:', profile.id);

      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError) {
        console.error('[Subscription] Subscription query error:', subError);
      }

      if (subscriptionData) {
        const sub: Subscription = {
          id: subscriptionData.id,
          planId: subscriptionData.plan,
          status: subscriptionData.status,
          currentPeriodStart: subscriptionData.current_period_start,
          currentPeriodEnd: subscriptionData.current_period_end,
          cancelAtPeriodEnd: subscriptionData.cancel_at_period_end
        };
        setSubscription(sub);
        const plan = plans.find(p => p.id === subscriptionData.plan) || getFreePlan();
        setCurrentPlan(plan);
        console.log(`[Subscription] Loaded plan: ${plan.name} (${subscriptionData.plan})`);
      } else {
        console.log('[Subscription] No active subscription found - defaulting to free');
        setCurrentPlan(getFreePlan());
      }

      const savedPaymentMethods = localStorage.getItem('statsor_payment_methods');
      if (savedPaymentMethods) {
        setPaymentMethods(JSON.parse(savedPaymentMethods));
      }
    } catch (error) {
      console.error('[Subscription] Unexpected error:', error);
      setCurrentPlan(getFreePlan());
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (planId: string, _paymentMethodId?: string): Promise<boolean> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        toast.error('Plan not found');
        return false;
      }

      const newSubscription: Subscription = {
        id: `sub_${Date.now()}`,
        planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + (plan.interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        ...(plan.price === 0 && { trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      };

      setSubscription(newSubscription);
      setCurrentPlan(plan);

      localStorage.setItem('statsor_subscription', JSON.stringify(newSubscription));

      toast.success(`Successfully subscribed to ${plan.name} plan!`);
      return true;
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (subscription) {
        const updatedSubscription = {
          ...subscription,
          status: 'canceled' as const,
          cancelAtPeriodEnd: true
        };

        setSubscription(updatedSubscription);
        localStorage.setItem('statsor_subscription', JSON.stringify(updatedSubscription));

        toast.success('Subscription canceled successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error('Failed to cancel subscription');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (_paymentMethodId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Payment method updated successfully');
      return true;
    } catch (error) {
      console.error('Update payment method error:', error);
      toast.error('Failed to update payment method');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (paymentData: any): Promise<boolean> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newPaymentMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'paypal',
        last4: paymentData.last4 || '****',
        brand: paymentData.brand || 'paypal'
      };

      const updatedMethods = [...paymentMethods, newPaymentMethod];
      setPaymentMethods(updatedMethods);
      localStorage.setItem('statsor_payment_methods', JSON.stringify(updatedMethods));

      toast.success('Payment method added successfully');
      return true;
    } catch (error) {
      console.error('Add payment method error:', error);
      toast.error('Failed to add payment method');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedMethods = paymentMethods.filter(pm => pm.id !== paymentMethodId);
      setPaymentMethods(updatedMethods);
      localStorage.setItem('statsor_payment_methods', JSON.stringify(updatedMethods));

      toast.success('Payment method removed successfully');
      return true;
    } catch (error) {
      console.error('Remove payment method error:', error);
      toast.error('Failed to remove payment method');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = (planId: string): Plan | null => {
    return plans.find(plan => plan.id === planId) || null;
  };

  const hasFeature = (feature: string): boolean => {
    if (!currentPlan) return false;

    switch (feature) {
      case 'ai_access':
        return currentPlan.aiAccess;
      case 'priority_support':
        return currentPlan.priority;
      case 'multiple_teams':
        return currentPlan.maxTeams > 1 || currentPlan.maxTeams === -1;
      case 'advanced_analytics':
        return currentPlan.id !== 'free';
      default:
        return false;
    }
  };

  const canCreateTeam = (): boolean => {
    if (!currentPlan) return false;
    if (currentPlan.maxTeams === -1) return true;
    const currentTeams = parseInt(localStorage.getItem('statsor_team_count') || '0');
    return currentTeams < currentPlan.maxTeams;
  };

  const canAddPlayer = (currentCount: number): boolean => {
    if (!currentPlan) return false;
    if (currentPlan.maxPlayers === -1) return true;
    return currentCount < currentPlan.maxPlayers;
  };

  const canUseAI = (): boolean => {
    return hasFeature('ai_access');
  };

  const getAIRequestsRemaining = (): number => {
    if (!currentPlan) return 0;
    if (currentPlan.aiRequestsPerDay === -1) return -1; // Unlimited

    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('statsor_ai_usage_date');
    const storedCount = parseInt(localStorage.getItem('statsor_ai_usage_today') || '0');

    // Reset count if it's a new day
    if (storedDate !== today) {
      localStorage.setItem('statsor_ai_usage_date', today);
      localStorage.setItem('statsor_ai_usage_today', '0');
      return currentPlan.aiRequestsPerDay;
    }

    return Math.max(0, currentPlan.aiRequestsPerDay - storedCount);
  };

  const incrementAIUsage = (): boolean => {
    if (!currentPlan) return false;

    // Unlimited for Pro plans
    if (currentPlan.aiRequestsPerDay === -1) return true;

    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('statsor_ai_usage_date');
    let storedCount = parseInt(localStorage.getItem('statsor_ai_usage_today') || '0');

    // Reset count if it's a new day
    if (storedDate !== today) {
      localStorage.setItem('statsor_ai_usage_date', today);
      storedCount = 0;
    }

    // Check if limit reached
    if (storedCount >= currentPlan.aiRequestsPerDay) {
      return false;
    }

    // Increment usage
    const newCount = storedCount + 1;
    localStorage.setItem('statsor_ai_usage_today', newCount.toString());

    return true;
  };

  const getUsageStats = () => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('statsor_ai_usage_date');
    const aiRequestsToday = storedDate === today ? parseInt(localStorage.getItem('statsor_ai_usage_today') || '0') : 0;
    const remaining = getAIRequestsRemaining();

    return {
      teams: parseInt(localStorage.getItem('statsor_team_count') || '0'),
      players: parseInt(localStorage.getItem('statsor_player_count') || '0'),
      aiUsage: parseInt(localStorage.getItem('statsor_ai_usage_count') || '0'),
      aiRequestsToday,
      aiRequestsRemaining: remaining
    };
  };

  const value: SubscriptionContextType = {
    plans,
    currentPlan,
    subscription,
    paymentMethods,
    loading,
    subscribe,
    cancelSubscription,
    updatePaymentMethod,
    addPaymentMethod,
    removePaymentMethod,
    getPlanFeatures,
    hasFeature,
    canCreateTeam,
    canAddPlayer,
    canUseAI,
    getAIRequestsRemaining,
    incrementAIUsage,
    getUsageStats
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
