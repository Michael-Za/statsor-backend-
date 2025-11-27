// Subscription system utilities for TeamPlaymate platform

import { queryCacheService } from './database';
import { emailAutomationService } from './email';

// Types for subscription system
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    teams: number;
    players: number;
    matches: number;
    storage: number; // in GB
    apiCalls: number;
  };
  popular?: boolean;
  stripePriceId?: string;
}

interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  trialEnd?: Date;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface UsageMetrics {
  userId: string;
  period: string;
  teams: number;
  players: number;
  matches: number;
  storageUsed: number;
  apiCalls: number;
  lastUpdated: Date;
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with basic team management',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'Manage up to 2 teams',
      'Track up to 25 players',
      'Record up to 10 matches per month',
      'Basic statistics',
      'Community support'
    ],
    limits: {
      teams: 2,
      players: 25,
      matches: 10,
      storage: 1,
      apiCalls: 1000
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for serious coaches and analysts',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Manage up to 10 teams',
      'Track unlimited players',
      'Record unlimited matches',
      'Advanced analytics & heat maps',
      'Performance predictions',
      'Export reports',
      'Priority support'
    ],
    limits: {
      teams: 10,
      players: -1, // unlimited
      matches: -1, // unlimited
      storage: 10,
      apiCalls: 10000
    },
    popular: true,
    stripePriceId: 'price_pro_monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for professional organizations',
    price: 99.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited teams',
      'Unlimited players',
      'Unlimited matches',
      'All analytics features',
      'Machine learning insights',
      'Custom integrations',
      'White-label options',
      'Dedicated support',
      'SLA guarantee'
    ],
    limits: {
      teams: -1, // unlimited
      players: -1, // unlimited
      matches: -1, // unlimited
      storage: 100,
      apiCalls: 100000
    },
    stripePriceId: 'price_enterprise_monthly'
  }
];

// Subscription Manager
export class SubscriptionManager {
  private stripePublicKey: string;
  private stripe: any;

  constructor() {
    this.stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';
    this.initializeStripe();
  }

  /**
   * Initialize Stripe
   */
  private async initializeStripe(): Promise<void> {
    if (typeof window !== 'undefined' && this.stripePublicKey) {
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(this.stripePublicKey);
    }
  }

  /**
   * Get all available subscription plans
   */
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get specific plan by ID
   */
  getPlan(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const cacheKey = queryCacheService.generatePlayerKey(userId, 'subscription', {});
    
    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const response = await fetch(`/api/subscriptions/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          return data.subscription;
        }
        return null;
      },
      300 // 5 minutes cache
    );
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(planId: string, userId: string, userInfo?: { name: string; email: string; location?: string }): Promise<{
    sessionId: string;
    url: string;
  }> {
    const plan = this.getPlan(planId);
    if (!plan || !plan.stripePriceId) {
      throw new Error('Invalid plan or missing Stripe price ID');
    }

    const response = await fetch('/api/subscriptions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: plan.stripePriceId,
        userId,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`,
        customerEmail: userInfo?.email,
        metadata: {
          userId,
          planId,
          userName: userInfo?.name || '',
          userEmail: userInfo?.email || '',
          userLocation: userInfo?.location || ''
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const result = await response.json();
    
    // Trigger email automation for checkout session created
    if (userInfo?.email) {
      await emailAutomationService.triggerWorkflow('subscription_checkout_started', {
        email: userInfo.email,
        name: userInfo.name,
        planName: plan.name,
        planPrice: plan.price,
        checkoutUrl: result.url
      });
    }

    return result;
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await this.stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    // Invalidate cache
    queryCacheService.invalidatePattern('*subscription*');
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/resume`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to resume subscription');
    }

    // Invalidate cache
    queryCacheService.invalidatePattern('*subscription*');
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(subscriptionId: string, newPlanId: string): Promise<void> {
    const newPlan = this.getPlan(newPlanId);
    if (!newPlan || !newPlan.stripePriceId) {
      throw new Error('Invalid plan');
    }

    const response = await fetch(`/api/subscriptions/${subscriptionId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priceId: newPlan.stripePriceId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }

    // Invalidate cache
    queryCacheService.invalidatePattern('*subscription*');
  }

  /**
   * Get payment methods for user
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const response = await fetch(`/api/payment-methods/user/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment methods');
    }

    const data = await response.json();
    return data.paymentMethods;
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const response = await fetch('/api/payment-methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        paymentMethodId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to add payment method');
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    const response = await fetch(`/api/payment-methods/${paymentMethodId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to remove payment method');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const response = await fetch(`/api/payment-methods/${paymentMethodId}/set-default`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('Failed to set default payment method');
    }
  }
}

// Feature Access Control
export class FeatureAccessControl {
  private userSubscription: UserSubscription | null = null;
  private currentPlan: SubscriptionPlan | null = null;

  constructor(private subscriptionManager: SubscriptionManager) {}

  /**
   * Initialize with user subscription data
   */
  async initialize(userId: string): Promise<void> {
    this.userSubscription = await this.subscriptionManager.getUserSubscription(userId);
    
    if (this.userSubscription) {
      this.currentPlan = this.subscriptionManager.getPlan(this.userSubscription.planId) || null;
    } else {
      // Default to free plan
      this.currentPlan = this.subscriptionManager.getPlan('free') || null;
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  hasFeatureAccess(feature: string): boolean {
    if (!this.currentPlan) return false;
    
    return this.currentPlan.features.some(f => 
      f.toLowerCase().includes(feature.toLowerCase())
    );
  }

  /**
   * Check if user is within usage limits
   */
  async checkUsageLimit(
    userId: string,
    resource: keyof SubscriptionPlan['limits'],
    currentUsage: number
  ): Promise<{
    allowed: boolean;
    limit: number;
    usage: number;
    remaining: number;
  }> {
    if (!this.currentPlan) {
      return {
        allowed: false,
        limit: 0,
        usage: currentUsage,
        remaining: 0
      };
    }

    const limit = this.currentPlan.limits[resource];
    const unlimited = limit === -1;
    const allowed = unlimited || currentUsage < limit;
    const remaining = unlimited ? -1 : Math.max(0, limit - currentUsage);

    return {
      allowed,
      limit,
      usage: currentUsage,
      remaining
    };
  }

  /**
   * Get current usage metrics
   */
  async getUsageMetrics(userId: string): Promise<UsageMetrics> {
    const cacheKey = queryCacheService.generatePlayerKey(userId, 'usage_metrics', {});
    
    return queryCacheService.cacheQuery(
      cacheKey,
      async () => {
        const response = await fetch(`/api/usage/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch usage metrics');
        }
        return response.json();
      },
      60 // 1 minute cache
    );
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(): boolean {
    if (!this.userSubscription) return false;
    
    return this.userSubscription.status === 'active' || 
           this.userSubscription.status === 'trialing';
  }

  /**
   * Check if subscription is in trial period
   */
  isInTrial(): boolean {
    if (!this.userSubscription || !this.userSubscription.trialEnd) return false;
    
    return new Date() < this.userSubscription.trialEnd;
  }

  /**
   * Get days remaining in current period
   */
  getDaysRemainingInPeriod(): number {
    if (!this.userSubscription) return 0;
    
    const now = new Date();
    const endDate = new Date(this.userSubscription.currentPeriodEnd);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Get subscription status summary
   */
  getSubscriptionStatus(): {
    planName: string;
    status: string;
    isActive: boolean;
    isInTrial: boolean;
    daysRemaining: number;
    features: string[];
    limits: SubscriptionPlan['limits'];
  } {
    return {
      planName: this.currentPlan?.name || 'Unknown',
      status: this.userSubscription?.status || 'none',
      isActive: this.isSubscriptionActive(),
      isInTrial: this.isInTrial(),
      daysRemaining: this.getDaysRemainingInPeriod(),
      features: this.currentPlan?.features || [],
      limits: this.currentPlan?.limits || {
        teams: 0,
        players: 0,
        matches: 0,
        storage: 0,
        apiCalls: 0
      }
    };
  }
}

// Usage Tracking Service
export class UsageTrackingService {
  private usageCache: Map<string, number> = new Map();
  private batchQueue: Array<{ userId: string; resource: string; increment: number }> = [];
  private batchInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startBatchProcessing();
  }

  /**
   * Track resource usage
   */
  trackUsage(userId: string, resource: string, increment = 1): void {
    const key = `${userId}:${resource}`;
    const current = this.usageCache.get(key) || 0;
    this.usageCache.set(key, current + increment);
    
    // Add to batch queue
    this.batchQueue.push({ userId, resource, increment });
  }

  /**
   * Start batch processing of usage data
   */
  private startBatchProcessing(): void {
    this.batchInterval = setInterval(() => {
      this.processBatch();
    }, 60000); // Process every minute
  }

  /**
   * Process batch of usage data
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    try {
      await fetch('/api/usage/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usage: batch })
      });
    } catch (error) {
      console.error('Failed to process usage batch:', error);
      // Re-add to queue for retry
      this.batchQueue.unshift(...batch);
    }
  }

  /**
   * Get current cached usage
   */
  getCachedUsage(userId: string, resource: string): number {
    const key = `${userId}:${resource}`;
    return this.usageCache.get(key) || 0;
  }

  /**
   * Clear usage cache
   */
  clearCache(): void {
    this.usageCache.clear();
  }

  /**
   * Stop batch processing
   */
  stop(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }
    
    // Process remaining batch
    if (this.batchQueue.length > 0) {
      this.processBatch();
    }
  }
}

// Billing Service
export class BillingService {
  constructor(private subscriptionManager: SubscriptionManager) {}

  /**
   * Get billing history
   */
  async getBillingHistory(userId: string): Promise<Array<{
    id: string;
    date: Date;
    amount: number;
    currency: string;
    description: string;
    status: string;
    invoiceUrl?: string;
  }>> {
    const response = await fetch(`/api/billing/history/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch billing history');
    }

    const data = await response.json();
    return data.invoices;
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(subscriptionId: string): Promise<{
    amount: number;
    currency: string;
    date: Date;
    items: Array<{
      description: string;
      amount: number;
    }>;
  } | null> {
    const response = await fetch(`/api/billing/upcoming/${subscriptionId}`);
    
    if (response.status === 404) {
      return null; // No upcoming invoice
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch upcoming invoice');
    }

    return response.json();
  }

  /**
   * Download invoice
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await fetch(`/api/billing/invoice/${invoiceId}/download`);
    
    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    return response.blob();
  }

  /**
   * Update billing address
   */
  async updateBillingAddress(userId: string, address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }): Promise<void> {
    const response = await fetch(`/api/billing/address/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(address)
    });

    if (!response.ok) {
      throw new Error('Failed to update billing address');
    }
  }
}

// Export service instances
export const subscriptionManager = new SubscriptionManager();
export const featureAccessControl = new FeatureAccessControl(subscriptionManager);
export const usageTrackingService = new UsageTrackingService();
export const billingService = new BillingService(subscriptionManager);

// Subscription service orchestrator
export class SubscriptionService {
  constructor(
    private subscriptionMgr = subscriptionManager,
    private accessControl = featureAccessControl,
    private usageTracking = usageTrackingService,
    private billing = billingService
  ) {}

  /**
   * Initialize subscription services for a user
   */
  async initialize(userId: string): Promise<void> {
    await this.accessControl.initialize(userId);
  }

  /**
   * Get comprehensive subscription info
   */
  async getSubscriptionInfo(userId: string): Promise<{
    subscription: UserSubscription | null;
    plan: SubscriptionPlan | null;
    status: any;
    usage: UsageMetrics;
    paymentMethods: PaymentMethod[];
  }> {
    const [subscription, usage, paymentMethods] = await Promise.all([
      this.subscriptionMgr.getUserSubscription(userId),
      this.accessControl.getUsageMetrics(userId),
      this.subscriptionMgr.getPaymentMethods(userId)
    ]);

    const plan = subscription ? this.subscriptionMgr.getPlan(subscription.planId) : null;
    const status = this.accessControl.getSubscriptionStatus();

    return {
      subscription,
      plan,
      status,
      usage,
      paymentMethods
    };
  }

  /**
   * Check if user can perform an action
   */
  async canPerformAction(
    userId: string,
    action: string,
    resource?: keyof SubscriptionPlan['limits']
  ): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  }> {
    // Check feature access
    if (!this.accessControl.hasFeatureAccess(action)) {
      return {
        allowed: false,
        reason: 'Feature not available in current plan',
        upgradeRequired: true
      };
    }

    // Check usage limits if resource specified
    if (resource) {
      const currentUsage = this.usageTracking.getCachedUsage(userId, resource);
      const usageCheck = await this.accessControl.checkUsageLimit(userId, resource, currentUsage);
      
      if (!usageCheck.allowed) {
        return {
          allowed: false,
          reason: `${resource} limit exceeded (${usageCheck.usage}/${usageCheck.limit})`,
          upgradeRequired: true
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Track action and check limits
   */
  async trackAction(
    userId: string,
    action: string,
    resource: keyof SubscriptionPlan['limits']
  ): Promise<void> {
    this.usageTracking.trackUsage(userId, resource, 1);
  }

  /**
   * Handle successful subscription (called by webhook or after payment success)
   */
  async handleSuccessfulSubscription(subscriptionData: {
    userId?: string;
    userName: string;
    userEmail: string;
    planId: string;
    paypalSubscriptionId?: string;
    userLocation?: string;
  }): Promise<void> {
    try {
      const plan = this.subscriptionMgr.getPlan(subscriptionData.planId);
      if (!plan) {
        throw new Error(`Plan not found: ${subscriptionData.planId}`);
      }
      
      // Send welcome email and admin notification
      await emailAutomationService.triggerWorkflow('subscription_activated', {
        email: subscriptionData.userEmail,
        name: subscriptionData.userName,
        planName: plan.name,
        planFeatures: plan.features,
        userLocation: subscriptionData.userLocation
      });

      console.log(`Subscription emails sent for user: ${subscriptionData.userEmail}`);
    } catch (error) {
      console.error('Failed to handle successful subscription:', error);
    }
  }

  /**
   * Handle successful payment (called by webhook)
   */
  async handleSuccessfulPayment(paymentData: {
    userName: string;
    userEmail: string;
    planId: string;
    amount: number;
    currency: string;
    invoiceUrl?: string;
    nextBillingDate?: string;
    userLocation?: string;
  }): Promise<void> {
    try {
      const plan = this.subscriptionMgr.getPlan(paymentData.planId);
      if (!plan) {
        throw new Error(`Plan not found: ${paymentData.planId}`);
      }
      
      // Send payment confirmation and admin notification
      await emailAutomationService.triggerWorkflow('payment_received', {
        email: paymentData.userEmail,
        name: paymentData.userName,
        planName: plan.name,
        amount: paymentData.amount,
        currency: paymentData.currency,
        invoiceUrl: paymentData.invoiceUrl,
        nextBillingDate: paymentData.nextBillingDate,
        userLocation: paymentData.userLocation
      });

      console.log(`Payment emails sent for user: ${paymentData.userEmail}`);
    } catch (error) {
      console.error('Failed to handle successful payment:', error);
    }
  }
}

export const subscriptionService = new SubscriptionService();