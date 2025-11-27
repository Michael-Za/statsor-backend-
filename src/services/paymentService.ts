// Production Payment Integration Service
import { toast } from 'sonner';

// Declare PayPal types
declare global {
  interface Window {
    paypal?: any;
  }
}

// Types for payment processing
interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    teams: number;
    players: number;
    matches: number;
    storage: number;
    apiCalls: number;
  };
  popular?: boolean;
}

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  clientSecret?: string;
}

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'pending';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

class ProductionPaymentService {
  private stripePublicKey: string;
  private paypalClientId: string;
  private baseUrl: string;
  
  constructor() {
    this.stripePublicKey = import.meta.env?.['VITE_STRIPE_PUBLISHABLE_KEY'] || '';
    this.paypalClientId = import.meta.env?.['VITE_PAYPAL_CLIENT_ID'] || '';
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    if (!this.stripePublicKey || !this.paypalClientId) {
      console.warn('Payment configuration incomplete. Some features may not work.');
    }
  }

  // === STRIPE INTEGRATION ===

  /**
   * Initialize Stripe with dynamic import
   */
  private async initializeStripe() {
    if (!this.stripePublicKey) {
      throw new Error('Stripe publishable key not configured');
    }

    const { loadStripe } = await import('@stripe/stripe-js');
    return await loadStripe(this.stripePublicKey);
  }

  /**
   * Create payment intent for subscription
   */
  async createPaymentIntent(planId: string, paymentMethodId?: string): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          planId,
          paymentMethodId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Payment intent creation failed:', error);
      toast.error(error.message || 'Payment setup failed');
      throw error;
    }
  }

  /**
   * Confirm payment with Stripe
   */
  async confirmStripePayment(paymentIntentId: string, cardElement?: any): Promise<boolean> {
    try {
      const stripe = await this.initializeStripe();
      if (!stripe) throw new Error('Stripe initialization failed');

      const { error, paymentIntent } = await stripe.confirmCardPayment(paymentIntentId, {
        payment_method: cardElement ? {
          card: cardElement,
          billing_details: {
            name: 'Customer Name'
          }
        } : undefined
      } as any); // Type assertion to bypass strict type checking

      if (error) {
        console.error('Stripe payment error:', error);
        toast.error(error.message || 'Payment failed');
        return false;
      }

      if (paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      toast.error(error.message || 'Payment confirmation failed');
      return false;
    }
  }

  // === PAYPAL INTEGRATION ===

  /**
   * Initialize PayPal SDK
   */
  private async initializePayPal() {
    return new Promise((resolve, reject) => {
      if (window.paypal) {
        resolve(window.paypal);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalClientId}&currency=EUR&intent=subscription`;
      script.onload = () => resolve(window.paypal);
      script.onerror = () => reject(new Error('PayPal SDK failed to load'));
      document.head.appendChild(script);
    });
  }

  /**
   * Create PayPal subscription
   */
  async createPayPalSubscription(planId: string): Promise<string> {
    try {
      const paypal = await this.initializePayPal() as any;
      
      return new Promise((resolve, reject) => {
        paypal.Buttons({
          createSubscription: async (data: any, actions: any) => {
            try {
              const response = await fetch(`${this.baseUrl}/api/v1/payments/paypal/create-subscription`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ planId })
              });

              const result = await response.json();
              return result.data.subscriptionId;
            } catch (error) {
              reject(error);
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              // Capture the subscription
              const response = await fetch(`${this.baseUrl}/api/v1/payments/paypal/capture-subscription`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ 
                  subscriptionId: data.subscriptionID,
                  orderID: data.orderID 
                })
              });

              if (response.ok) {
                toast.success('PayPal subscription created successfully!');
                resolve(data.subscriptionID);
              } else {
                throw new Error('Failed to capture PayPal subscription');
              }
            } catch (error) {
              reject(error);
            }
          },
          onError: (error: any) => {
            console.error('PayPal error:', error);
            toast.error('PayPal payment failed');
            reject(error);
          }
        }).render('#paypal-button-container');
      });
    } catch (error: any) {
      console.error('PayPal initialization failed:', error);
      toast.error(error.message || 'PayPal setup failed');
      throw error;
    }
  }

  // === SUBSCRIPTION MANAGEMENT ===

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/subscriptions/plans`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch plans');
      }

      return data.data;
    } catch (error: any) {
      console.error('Failed to fetch subscription plans:', error);
      toast.error('Failed to load subscription plans');
      
      // Return fallback plans
      return this.getFallbackPlans();
    }
  }

  /**
   * Get current user subscription
   */
  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/subscriptions/current`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Failed to fetch current subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ cancelAtPeriodEnd })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const message = cancelAtPeriodEnd 
        ? 'Subscription will be cancelled at the end of the current period'
        : 'Subscription cancelled immediately';
      
      toast.success(message);
      return true;
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
      return false;
    }
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changeSubscription(newPlanId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/subscriptions/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ planId: newPlanId })
      });

      if (!response.ok) {
        throw new Error('Failed to change subscription');
      }

      toast.success('Subscription updated successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to change subscription:', error);
      toast.error(error.message || 'Failed to update subscription');
      return false;
    }
  }

  // === PAYMENT METHODS ===

  /**
   * Get saved payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/methods`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Failed to fetch payment methods:', error);
      return [];
    }
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }

      toast.success('Payment method added successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      toast.error(error.message || 'Failed to add payment method');
      return false;
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/payments/methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove payment method');
      }

      toast.success('Payment method removed successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to remove payment method:', error);
      toast.error(error.message || 'Failed to remove payment method');
      return false;
    }
  }

  // === UTILITY METHODS ===

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token') || '';
  }

  private getFallbackPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'EUR',
        interval: 'month',
        features: [
          'Up to 1 team',
          'Up to 25 players',
          'Basic analytics',
          'Community support'
        ],
        limits: {
          teams: 1,
          players: 25,
          matches: 10,
          storage: 100, // MB
          apiCalls: 1000
        }
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 19.99,
        currency: 'EUR',
        interval: 'month',
        popular: true,
        features: [
          'Up to 5 teams',
          'Up to 150 players',
          'Advanced analytics',
          'Real-time tracking',
          'Priority support'
        ],
        limits: {
          teams: 5,
          players: 150,
          matches: 100,
          storage: 5000, // MB
          apiCalls: 10000
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 49.99,
        currency: 'EUR',
        interval: 'month',
        features: [
          'Unlimited teams',
          'Unlimited players',
          'Custom analytics',
          'API access',
          '24/7 support',
          'Custom integrations'
        ],
        limits: {
          teams: -1,
          players: -1,
          matches: -1,
          storage: -1,
          apiCalls: -1
        }
      }
    ];
  }
}

// Export singleton instance
export const paymentService = new ProductionPaymentService();
export type { PaymentMethod, SubscriptionPlan, PaymentIntent, Subscription };