/*
  # Create Subscriptions and Payments Tables

  ## Overview
  Creates comprehensive tables for managing subscriptions, payments, and user payment history.

  ## New Tables
  
  ### subscriptions
  - `id` (uuid, primary key): Unique subscription identifier
  - `user_id` (uuid): References auth.users table
  - `plan_id` (text): Subscription plan identifier (free, pro, pro_plus)
  - `status` (text): Subscription status (active, cancelled, expired, past_due)
  - `billing_interval` (text): Billing cycle (monthly, yearly)
  - `amount` (numeric): Subscription amount
  - `currency` (text): Payment currency (EUR, USD)
  - `start_date` (timestamptz): Subscription start date
  - `end_date` (timestamptz): Subscription end date
  - `cancel_at_period_end` (boolean): Whether to cancel at period end
  - `created_at` (timestamptz): Record creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### payments
  - `id` (uuid, primary key): Unique payment identifier
  - `user_id` (uuid): References auth.users table
  - `subscription_id` (uuid): References subscriptions table
  - `payment_method` (text): Payment method (paypal)
  - `payment_provider_id` (text): PayPal order/transaction ID
  - `amount` (numeric): Payment amount
  - `currency` (text): Payment currency
  - `status` (text): Payment status (pending, completed, failed, refunded)
  - `payer_email` (text): PayPal payer email
  - `payer_id` (text): PayPal payer ID
  - `payment_date` (timestamptz): Payment date
  - `created_at` (timestamptz): Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only view their own subscriptions and payments
  - Only authenticated users can access the data
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  billing_interval text NOT NULL DEFAULT 'yearly',
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  payment_method text NOT NULL DEFAULT 'paypal',
  payment_provider_id text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  payer_email text,
  payer_id text,
  payment_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(payment_provider_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();