import { supabase } from '../lib/supabase';

interface PayPalPaymentData {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  userEmail: string;
  userId?: string;
}

interface PayPalResponse {
  success: boolean;
  paymentId?: string;
  error?: string;
  redirectUrl?: string;
}

class PayPalService {
  private paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  private paypalSecret = import.meta.env.VITE_PAYPAL_SECRET;
  private paypalMode = import.meta.env.VITE_PAYPAL_MODE || 'live';
  private paypalEmail = 'statsor1@gmail.com';

  private getPayPalBaseUrl(): string {
    return this.paypalMode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.getPayPalBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.paypalClientId}:${this.paypalSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error('Failed to get PayPal access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('PayPal access token error:', error);
      throw error;
    }
  }

  async createPayment(paymentData: PayPalPaymentData): Promise<PayPalResponse> {
    try {
      if (!paymentData.userEmail || !paymentData.planId) {
        return {
          success: false,
          error: 'Missing required payment information'
        };
      }

      if (paymentData.planId === 'free') {
        return {
          success: false,
          error: 'Free plan does not require payment'
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', paymentData.planId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingSubscription) {
        return {
          success: false,
          error: 'You already have an active subscription for this plan'
        };
      }

      const accessToken = await this.getAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: paymentData.currency,
            value: paymentData.amount.toFixed(2)
          },
          description: `${paymentData.planName} - ${paymentData.billingInterval} subscription`,
          payee: {
            email_address: this.paypalEmail
          }
        }],
        application_context: {
          brand_name: 'Statsor',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${window.location.origin}/payment/success?plan=${paymentData.planId}&interval=${paymentData.billingInterval}`,
          cancel_url: `${window.location.origin}/payment/cancel`
        }
      };

      const response = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create PayPal order');
      }

      const result = await response.json();

      if (result.id && result.links) {
        const approvalUrl = result.links.find((link: any) => link.rel === 'approve')?.href;

        if (approvalUrl) {
          localStorage.setItem('pendingPayment', JSON.stringify({
            ...paymentData,
            paypalOrderId: result.id,
            timestamp: Date.now()
          }));

          return {
            success: true,
            paymentId: result.id,
            redirectUrl: approvalUrl
          };
        }
      }

      return {
        success: false,
        error: 'Failed to create PayPal payment'
      };

    } catch (error) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment service temporarily unavailable'
      };
    }
  }

  async verifyPayment(orderId: string): Promise<boolean> {
    try {
      const pendingPayment = localStorage.getItem('pendingPayment');
      if (!pendingPayment) return false;

      const paymentData: PayPalPaymentData & { paypalOrderId: string } = JSON.parse(pendingPayment);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to capture PayPal payment');
      }

      const result = await response.json();

      if (result.status === 'COMPLETED') {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + (paymentData.billingInterval === 'yearly' ? 1 : 0));
        endDate.setMonth(endDate.getMonth() + (paymentData.billingInterval === 'monthly' ? 1 : 0));

        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: paymentData.planId,
            status: 'active',
            billing_interval: paymentData.billingInterval,
            amount: paymentData.amount,
            currency: paymentData.currency,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            cancel_at_period_end: false
          })
          .select()
          .single();

        if (subError) throw subError;

        const capture = result.purchase_units[0].payments.captures[0];
        await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            subscription_id: subscription.id,
            payment_method: 'paypal',
            payment_provider_id: capture.id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            status: 'completed',
            payer_email: result.payer.email_address,
            payer_id: result.payer.payer_id,
            payment_date: new Date().toISOString()
          });

        localStorage.removeItem('pendingPayment');

        await this.storeSuccessfulPayment(paymentData, orderId);

        return true;
      }

      return false;

    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  private async storeSuccessfulPayment(paymentData: PayPalPaymentData, paymentId: string) {
    try {
      const payments = JSON.parse(localStorage.getItem('payments') || '[]');
      payments.push({
        paymentId,
        userEmail: paymentData.userEmail,
        userId: paymentData.userId,
        planId: paymentData.planId,
        planName: paymentData.planName,
        amount: paymentData.amount,
        currency: paymentData.currency,
        billingInterval: paymentData.billingInterval,
        paypalEmail: this.paypalEmail,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
      localStorage.setItem('payments', JSON.stringify(payments));

      console.log('Payment stored:', paymentData);

    } catch (error) {
      console.error('Error storing payment:', error);
    }
  }

  getPaymentHistory(userEmail: string) {
    try {
      const payments = JSON.parse(localStorage.getItem('payments') || '[]');
      return payments.filter((payment: any) => payment.userEmail === userEmail);
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  async hasActiveSubscription(planId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .eq('status', 'active')
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  getPaymentAttempts(userEmail: string, planId: string): number {
    return 0;
  }

  resetPaymentAttempts(userEmail: string, planId: string) {
    console.log('Payment attempts reset for', userEmail, planId);
  }
}

export const paypalService = new PayPalService();
