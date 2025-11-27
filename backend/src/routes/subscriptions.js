const express = require('express');
const Joi = require('joi');
const paypal = require('paypal-rest-sdk');
const databaseService = require('../services/database.js');
const redisService = require('../services/redis.js');
const { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError,
  PaymentError 
} = require('../middleware/errorHandler.js');
const { 
  authenticateToken, 
  requireRole, 
  requireSubscription 
} = require('../middleware/auth.js');
const crypto = require('crypto');
const winston = require('winston');

const router = express.Router();
const db = databaseService;
const redis = redisService;

// PayPal configuration
paypal.configure({
  mode: 'live', // Always use live mode for production
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Initialize PayPal client
const paypalClient = paypal;

// Logger for payment events
const paymentLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/payments.log' }),
    new winston.transports.Console()
  ]
});

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Basic analytics',
      'Up to 25 players',
      'Match scheduling',
      'Basic reporting'
    ],
    limits: {
      players: 25,
      matches_per_month: 50,
      storage_gb: 1
    }
  },
  pro: {
    name: 'Pro Plan',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Advanced analytics',
      'Up to 50 players',
      'Live match tracking',
      'Advanced reporting',
      'Training management',
      'Chat features'
    ],
    limits: {
      players: 50,
      matches_per_month: 200,
      storage_gb: 5
    }
  },
  premium: {
    name: 'Premium Plan',
    price: 39.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'All Pro features',
      'Unlimited players',
      'Video analysis',
      'Custom integrations',
      'Priority support',
      'White-label options'
    ],
    limits: {
      players: -1, // Unlimited
      matches_per_month: -1, // Unlimited
      storage_gb: 50
    }
  }
};

// Validation schemas
const createSubscriptionSchema = Joi.object({
  body: Joi.object({
    plan_id: Joi.string().valid('basic', 'pro', 'premium').required(),
    payment_method: Joi.string().valid('paypal').required(),
    billing_cycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
    coupon_code: Joi.string().optional()
  })
});

const updatePaymentMethodSchema = Joi.object({
  body: Joi.object({
    payment_method_id: Joi.string().required(),
    provider: Joi.string().valid('paypal').required()
  })
});

// Note: Stripe validation schemas removed - using PayPal only

const applyCouponSchema = Joi.object({
  body: Joi.object({
    coupon_code: Joi.string().required()
  })
});

// Helper functions
const calculateDiscountedPrice = (basePrice, discountPercent, billingCycle) => {
  let price = basePrice;
  
  // Apply yearly discount (typically 20% off)
  if (billingCycle === 'yearly') {
    price = price * 12 * 0.8; // 20% discount for yearly
  }
  
  // Apply coupon discount
  if (discountPercent > 0) {
    price = price * (1 - discountPercent / 100);
  }
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
};

const validateCoupon = async (couponCode) => {
  const coupon = await db.query(`
    SELECT * FROM coupons 
    WHERE code = $1 
      AND active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit)
  `, [couponCode]);

  return coupon.length > 0 ? coupon[0] : null;
};

// Stripe functions removed - using PayPal only

const createPayPalSubscription = async (planId, billingCycle) => {
  try {
    const plan = SUBSCRIPTION_PLANS[planId];
    const interval = billingCycle === 'yearly' ? 'YEAR' : 'MONTH';
    
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: plan.currency,
          value: calculateDiscountedPrice(plan.price, 0, billingCycle).toString()
        },
        description: `${plan.name} - ${billingCycle} billing`
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`
      }
    });
    
    const order = await paypalClient.execute(request);
    return order;
  } catch (error) {
    paymentLogger.error('PayPal subscription creation failed', { 
      plan_id: planId, 
      error: error.message 
    });
    throw new PaymentError('Failed to create PayPal subscription');
  }
};

const updateSubscriptionUsage = async (subscriptionId, usageType, amount = 1) => {
  const currentUsage = await redis.hget(`subscription:${subscriptionId}:usage`, usageType) || '0';
  const newUsage = parseInt(currentUsage) + amount;
  
  await redis.hset(`subscription:${subscriptionId}:usage`, usageType, newUsage.toString());
  
  // Set expiry for usage data (reset monthly)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const ttl = Math.floor((nextMonth - now) / 1000);
  
  await redis.expire(`subscription:${subscriptionId}:usage`, ttl);
  
  return newUsage;
};

// Routes

// @route   GET /api/subscriptions/plans
// @desc    Get available subscription plans
// @access  Public
router.get('/plans', (req, res) => {
  res.json({
    plans: SUBSCRIPTION_PLANS
  });
});

// @route   GET /api/subscriptions/current
// @desc    Get current user subscription
// @access  Private
router.get('/current',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const subscription = await db.query(`
      SELECT 
        s.*,
        sp.name as plan_name,
        sp.features,
        sp.limits
      FROM subscriptions s
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (!subscription.length) {
      return res.json({
        subscription: null,
        message: 'No active subscription found'
      });
    }

    // Get current usage
    const usage = await redis.hgetall(`subscription:${subscription[0].id}:usage`) || {};
    
    res.json({
      subscription: {
        ...subscription[0],
        current_usage: usage
      }
    });
  })
);

// @route   POST /api/subscriptions/create
// @desc    Create new subscription
// @access  Private
router.post('/create',
  authenticateToken,
  validateRequest(createSubscriptionSchema),
  asyncHandler(async (req, res) => {
    const { plan_id, payment_method, billing_cycle, coupon_code } = req.body;
    
    // Check if user already has active subscription
    const existingSubscription = await db.query(`
      SELECT id FROM subscriptions 
      WHERE user_id = $1 AND status = 'active'
    `, [req.user.id]);

    if (existingSubscription.length > 0) {
      throw new ValidationError('You already have an active subscription');
    }

    const plan = SUBSCRIPTION_PLANS[plan_id];
    if (!plan) {
      throw new ValidationError('Invalid plan selected');
    }

    let discountPercent = 0;
    let couponId = null;

    // Validate coupon if provided
    if (coupon_code) {
      const coupon = await validateCoupon(coupon_code);
      if (!coupon) {
        throw new ValidationError('Invalid or expired coupon code');
      }
      discountPercent = coupon.discount_percent;
      couponId = coupon.id;
    }

    const finalPrice = calculateDiscountedPrice(plan.price, discountPercent, billing_cycle);

    let paymentResult;
    let externalSubscriptionId;

    // Only PayPal payment method supported
    if (payment_method === 'paypal') {
      paymentResult = await createPayPalSubscription(plan_id, billing_cycle);
      externalSubscriptionId = paymentResult.result.id;
    } else {
      throw new PaymentError('Only PayPal payment method is supported');
    }

    // Create subscription record (pending until payment confirmed)
    const subscription = await db.create('subscriptions', {
      user_id: req.user.id,
      team_id: req.user.team_id,
      plan_id,
      status: 'pending',
      billing_cycle,
      amount: finalPrice,
      currency: plan.currency,
      payment_provider: payment_method,
      external_subscription_id: externalSubscriptionId,
      coupon_id: couponId,
      next_billing_date: billing_cycle === 'yearly' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    });

    paymentLogger.info('Subscription creation initiated', {
      user_id: req.user.id,
      subscription_id: subscription.id,
      plan_id,
      payment_method,
      amount: finalPrice
    });

    res.status(201).json({
      message: 'Subscription creation initiated',
      subscription_id: subscription.id,
      payment_data: paymentResult
    });
  })
);

// @route   POST /api/subscriptions/confirm
// @desc    Confirm subscription payment
// @access  Private
router.post('/confirm',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { subscription_id, payment_intent_id, paypal_order_id } = req.body;

    const subscription = await db.findById('subscriptions', subscription_id);
    if (!subscription || subscription.user_id !== req.user.id) {
      throw new NotFoundError('Subscription not found');
    }

    if (subscription.status !== 'pending') {
      throw new ValidationError('Subscription is not in pending status');
    }

    let paymentConfirmed = false;

    // Only PayPal payment confirmation supported
    if (subscription.payment_provider === 'paypal' && paypal_order_id) {
      try {
        const request = new paypal.orders.OrdersCaptureRequest(paypal_order_id);
        const capture = await paypalClient.execute(request);
        paymentConfirmed = capture.result.status === 'COMPLETED';
      } catch (error) {
        paymentLogger.error('PayPal payment confirmation failed', {
          subscription_id,
          paypal_order_id,
          error: error.message
        });
      }
    }

    if (!paymentConfirmed) {
      throw new PaymentError('Payment confirmation failed');
    }

    // Update subscription status
    const updatedSubscription = await db.update('subscriptions', subscription_id, {
      status: 'active',
      activated_at: new Date(),
      updated_at: new Date()
    });

    // Update coupon usage if applicable
    if (subscription.coupon_id) {
      await db.query(`
        UPDATE coupons 
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = $1
      `, [subscription.coupon_id]);
    }

    // Initialize usage tracking
    await redis.hset(`subscription:${subscription_id}:usage`, 'players', '0');
    await redis.hset(`subscription:${subscription_id}:usage`, 'matches', '0');
    await redis.hset(`subscription:${subscription_id}:usage`, 'storage_mb', '0');

    paymentLogger.info('Subscription activated', {
      user_id: req.user.id,
      subscription_id,
      plan_id: subscription.plan_id
    });

    res.json({
      message: 'Subscription activated successfully',
      subscription: updatedSubscription
    });
  })
);

// @route   PUT /api/subscriptions/upgrade
// @desc    Upgrade subscription plan
// @access  Private
router.put('/upgrade',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { new_plan_id } = req.body;

    if (!SUBSCRIPTION_PLANS[new_plan_id]) {
      throw new ValidationError('Invalid plan selected');
    }

    const currentSubscription = await db.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (!currentSubscription.length) {
      throw new NotFoundError('No active subscription found');
    }

    const subscription = currentSubscription[0];
    const currentPlan = SUBSCRIPTION_PLANS[subscription.plan_id];
    const newPlan = SUBSCRIPTION_PLANS[new_plan_id];

    if (newPlan.price <= currentPlan.price) {
      throw new ValidationError('You can only upgrade to a higher-tier plan');
    }

    // Calculate prorated amount
    const daysRemaining = Math.ceil(
      (new Date(subscription.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = subscription.billing_cycle === 'yearly' ? 365 : 30;
    const proratedAmount = ((newPlan.price - currentPlan.price) * daysRemaining) / totalDays;

    // Update subscription
    const updatedSubscription = await db.update('subscriptions', subscription.id, {
      plan_id: new_plan_id,
      amount: newPlan.price,
      updated_at: new Date()
    });

    // Process prorated payment (simplified - in production, integrate with payment processor)
    paymentLogger.info('Subscription upgraded', {
      user_id: req.user.id,
      subscription_id: subscription.id,
      old_plan: subscription.plan_id,
      new_plan: new_plan_id,
      prorated_amount: proratedAmount
    });

    res.json({
      message: 'Subscription upgraded successfully',
      subscription: updatedSubscription,
      prorated_charge: proratedAmount
    });
  })
);

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { immediate = false, reason } = req.body;

    const subscription = await db.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (!subscription.length) {
      throw new NotFoundError('No active subscription found');
    }

    const sub = subscription[0];
    const cancelDate = immediate ? new Date() : new Date(sub.next_billing_date);

    // Cancel with payment provider (PayPal only)
    if (sub.payment_provider === 'paypal' && sub.external_subscription_id) {
      // PayPal subscription cancellation would be handled here
      // For now, we'll just update the local record
      paymentLogger.info('PayPal subscription cancellation requested', {
        subscription_id: sub.id,
        external_subscription_id: sub.external_subscription_id
      });
    }

    // Update subscription status
    const updatedSubscription = await db.update('subscriptions', sub.id, {
      status: immediate ? 'cancelled' : 'cancel_at_period_end',
      cancelled_at: immediate ? new Date() : null,
      cancel_at_period_end: !immediate,
      cancellation_reason: reason,
      updated_at: new Date()
    });

    paymentLogger.info('Subscription cancelled', {
      user_id: req.user.id,
      subscription_id: sub.id,
      immediate,
      reason
    });

    res.json({
      message: immediate 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will be cancelled at the end of the billing period',
      subscription: updatedSubscription,
      access_until: immediate ? new Date() : sub.next_billing_date
    });
  })
);

// @route   PUT /api/subscriptions/payment-method
// @desc    Update payment method
// @access  Private
router.put('/payment-method',
  authenticateToken,
  validateRequest(updatePaymentMethodSchema),
  asyncHandler(async (req, res) => {
    const { payment_method_id, provider } = req.body;

    const subscription = await db.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (!subscription.length) {
      throw new NotFoundError('No active subscription found');
    }

    const sub = subscription[0];

    // Only PayPal payment method updates supported
    if (provider !== 'paypal') {
      throw new PaymentError('Only PayPal payment method is supported');
    }
    
    // PayPal payment method updates would be handled here
    // For now, we'll just update the record

    // Update subscription record
    await db.update('subscriptions', sub.id, {
      payment_method_id,
      updated_at: new Date()
    });

    res.json({
      message: 'Payment method updated successfully'
    });
  })
);

// @route   POST /api/subscriptions/apply-coupon
// @desc    Apply coupon to subscription
// @access  Private
router.post('/apply-coupon',
  authenticateToken,
  validateRequest(applyCouponSchema),
  asyncHandler(async (req, res) => {
    const { coupon_code } = req.body;

    const coupon = await validateCoupon(coupon_code);
    if (!coupon) {
      throw new ValidationError('Invalid or expired coupon code');
    }

    const subscription = await db.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (!subscription.length) {
      throw new NotFoundError('No active subscription found');
    }

    const sub = subscription[0];

    // Check if coupon is already applied
    if (sub.coupon_id) {
      throw new ValidationError('A coupon is already applied to this subscription');
    }

    // Apply coupon discount to next billing cycle
    const plan = SUBSCRIPTION_PLANS[sub.plan_id];
    const discountedPrice = calculateDiscountedPrice(plan.price, coupon.discount_percent, sub.billing_cycle);

    await db.update('subscriptions', sub.id, {
      coupon_id: coupon.id,
      amount: discountedPrice,
      updated_at: new Date()
    });

    // Update coupon usage
    await db.query(`
      UPDATE coupons 
      SET usage_count = usage_count + 1,
          updated_at = NOW()
      WHERE id = $1
    `, [coupon.id]);

    res.json({
      message: 'Coupon applied successfully',
      discount_percent: coupon.discount_percent,
      new_amount: discountedPrice
    });
  })
);

// @route   GET /api/subscriptions/usage
// @desc    Get subscription usage statistics
// @access  Private
router.get('/usage',
  authenticateToken,
  requireSubscription,
  asyncHandler(async (req, res) => {
    const subscription = await db.query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (!subscription.length) {
      throw new NotFoundError('No active subscription found');
    }

    const sub = subscription[0];
    const plan = SUBSCRIPTION_PLANS[sub.plan_id];
    const usage = await redis.hgetall(`subscription:${sub.id}:usage`) || {};

    // Get actual counts from database for accuracy
    const actualUsage = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM players WHERE team_id = $1) as players_count,
        (SELECT COUNT(*) FROM matches WHERE team_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)) as matches_this_month,
        (SELECT COALESCE(SUM(file_size), 0) / (1024*1024) FROM chat_messages WHERE file_url IS NOT NULL AND sender_id = $2) as storage_mb
    `, [req.user.team_id, req.user.id]);

    const currentUsage = {
      players: parseInt(actualUsage[0].players_count) || 0,
      matches_this_month: parseInt(actualUsage[0].matches_this_month) || 0,
      storage_mb: parseFloat(actualUsage[0].storage_mb) || 0
    };

    // Calculate usage percentages
    const usagePercentages = {
      players: plan.limits.players === -1 ? 0 : (currentUsage.players / plan.limits.players) * 100,
      matches: plan.limits.matches_per_month === -1 ? 0 : (currentUsage.matches_this_month / plan.limits.matches_per_month) * 100,
      storage: (currentUsage.storage_mb / (plan.limits.storage_gb * 1024)) * 100
    };

    res.json({
      subscription: sub,
      plan_limits: plan.limits,
      current_usage: currentUsage,
      usage_percentages: usagePercentages,
      warnings: {
        players_near_limit: usagePercentages.players > 80,
        matches_near_limit: usagePercentages.matches > 80,
        storage_near_limit: usagePercentages.storage > 80
      }
    });
  })
);

// @route   GET /api/subscriptions/invoices
// @desc    Get subscription invoices
// @access  Private
router.get('/invoices',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const invoices = await db.query(`
      SELECT 
        i.*,
        s.plan_id,
        sp.name as plan_name
      FROM subscription_invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1
      ORDER BY i.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const totalCount = await db.query(`
      SELECT COUNT(*) as count
      FROM subscription_invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      WHERE s.user_id = $1
    `, [req.user.id]);

    res.json({
      invoices,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: parseInt(totalCount[0].count),
        total_pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  })
);

// Stripe webhook removed - using PayPal only

// Stripe webhook helper functions removed - using PayPal only

module.exports = router;
module.exports.default = module.exports;