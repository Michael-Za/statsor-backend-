// Email Service for TeamPlaymate Sports Analytics Platform
// Handles automated emails: welcome messages, password recovery, admin notifications

import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { z } from 'zod';

// Email configuration schema
const EmailConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  secure: z.boolean(),
  user: z.string().email(),
  password: z.string(),
  fromEmail: z.string().email(),
  adminEmail: z.string().email()
});

// Email types
type EmailType = 
  | 'welcome_subscription'
  | 'password_recovery'
  | 'subscription_confirmation'
  | 'payment_success'
  | 'admin_new_subscriber'
  | 'admin_payment_received'
  | 'account_recovery_success';

// Email template data interfaces
interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  planName: string;
  planFeatures: string[];
  loginUrl: string;
}

interface PasswordRecoveryData {
  userName: string;
  userEmail: string;
  resetToken: string;
  resetUrl: string;
  expiresIn: string;
}

interface PaymentEmailData {
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  nextBillingDate?: string;
}

interface AdminNotificationData {
  userName: string;
  userEmail: string;
  planName?: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  userLocation?: string;
}

// Password recovery token storage (in production, use Redis or database)
interface RecoveryToken {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private config: z.infer<typeof EmailConfigSchema>;
  private recoveryTokens: Map<string, RecoveryToken> = new Map();

  constructor() {
    this.config = EmailConfigSchema.parse({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASS || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@teamplaymate.com',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@teamplaymate.com'
    });

    this.transporter = nodemailer.createTransporter({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Verify email configuration
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connected successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  // Generate secure password recovery token
  generateRecoveryToken(userId: string, email: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const recoveryToken: RecoveryToken = {
      userId,
      email,
      token,
      expiresAt,
      used: false
    };

    this.recoveryTokens.set(token, recoveryToken);
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  // Validate recovery token
  validateRecoveryToken(token: string): RecoveryToken | null {
    const recoveryToken = this.recoveryTokens.get(token);
    
    if (!recoveryToken) {
      return null;
    }

    if (recoveryToken.used || recoveryToken.expiresAt < new Date()) {
      this.recoveryTokens.delete(token);
      return null;
    }

    return recoveryToken;
  }

  // Mark recovery token as used
  useRecoveryToken(token: string): boolean {
    const recoveryToken = this.recoveryTokens.get(token);
    
    if (!recoveryToken || recoveryToken.used) {
      return false;
    }

    recoveryToken.used = true;
    this.recoveryTokens.set(token, recoveryToken);
    return true;
  }

  // Clean up expired tokens
  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.recoveryTokens.entries()) {
      if (data.expiresAt < now || data.used) {
        this.recoveryTokens.delete(token);
      }
    }
  }

  // Send welcome email for new subscribers
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const htmlContent = this.generateWelcomeEmailTemplate(data);
      const textContent = this.generateWelcomeEmailText(data);

      await this.transporter.sendMail({
        from: `"TeamPlaymate" <${this.config.fromEmail}>`,
        to: data.userEmail,
        subject: `🎉 Welcome to TeamPlaymate ${data.planName} Plan!`,
        text: textContent,
        html: htmlContent
      });

      console.log(`Welcome email sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  // Send password recovery email
  async sendPasswordRecoveryEmail(userId: string, email: string, userName: string): Promise<boolean> {
    try {
      const resetToken = this.generateRecoveryToken(userId, email);
      const resetUrl = `${process.env.VITE_FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const data: PasswordRecoveryData = {
        userName,
        userEmail: email,
        resetToken,
        resetUrl,
        expiresIn: '24 hours'
      };

      const htmlContent = this.generatePasswordRecoveryTemplate(data);
      const textContent = this.generatePasswordRecoveryText(data);

      await this.transporter.sendMail({
        from: `"TeamPlaymate Security" <${this.config.fromEmail}>`,
        to: email,
        subject: '🔐 Reset Your TeamPlaymate Password',
        text: textContent,
        html: htmlContent
      });

      console.log(`Password recovery email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send password recovery email:', error);
      return false;
    }
  }

  // Send payment confirmation email
  async sendPaymentConfirmationEmail(data: PaymentEmailData): Promise<boolean> {
    try {
      const htmlContent = this.generatePaymentConfirmationTemplate(data);
      const textContent = this.generatePaymentConfirmationText(data);

      await this.transporter.sendMail({
        from: `"TeamPlaymate Billing" <${this.config.fromEmail}>`,
        to: data.userEmail,
        subject: `💳 Payment Confirmed - ${data.planName} Plan`,
        text: textContent,
        html: htmlContent
      });

      console.log(`Payment confirmation email sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
      return false;
    }
  }

  // Send admin notification for new subscriber
  async sendAdminNewSubscriberNotification(data: AdminNotificationData): Promise<boolean> {
    try {
      const htmlContent = this.generateAdminSubscriberTemplate(data);
      const textContent = this.generateAdminSubscriberText(data);

      await this.transporter.sendMail({
        from: `"TeamPlaymate System" <${this.config.fromEmail}>`,
        to: this.config.adminEmail,
        subject: `🆕 New Subscriber: ${data.userName} (${data.planName})`,
        text: textContent,
        html: htmlContent
      });

      console.log(`Admin notification sent for new subscriber: ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send admin subscriber notification:', error);
      return false;
    }
  }

  // Send admin notification for payment received
  async sendAdminPaymentNotification(data: AdminNotificationData): Promise<boolean> {
    try {
      const htmlContent = this.generateAdminPaymentTemplate(data);
      const textContent = this.generateAdminPaymentText(data);

      await this.transporter.sendMail({
        from: `"TeamPlaymate System" <${this.config.fromEmail}>`,
        to: this.config.adminEmail,
        subject: `💰 Payment Received: $${data.amount} from ${data.userName}`,
        text: textContent,
        html: htmlContent
      });

      console.log(`Admin payment notification sent for: ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send admin payment notification:', error);
      return false;
    }
  }

  // Send account recovery success email
  async sendAccountRecoverySuccessEmail(email: string, userName: string): Promise<boolean> {
    try {
      const htmlContent = this.generateRecoverySuccessTemplate(userName);
      const textContent = this.generateRecoverySuccessText(userName);

      await this.transporter.sendMail({
        from: `"TeamPlaymate Security" <${this.config.fromEmail}>`,
        to: email,
        subject: '✅ Password Successfully Reset',
        text: textContent,
        html: htmlContent
      });

      console.log(`Recovery success email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send recovery success email:', error);
      return false;
    }
  }

  // Email template generators
  private generateWelcomeEmailTemplate(data: WelcomeEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TeamPlaymate</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Welcome to TeamPlaymate!</h1>
            <p>Thank you for subscribing to our ${data.planName} plan</p>
        </div>
        <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Congratulations on joining TeamPlaymate! We're excited to help you take your sports analytics to the next level.</p>
            
            <div class="features">
                <h3>Your ${data.planName} Plan Includes:</h3>
                <ul>
                    ${data.planFeatures.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            
            <p>Ready to get started? Click the button below to access your dashboard:</p>
            <a href="${data.loginUrl}" class="button">Access Your Dashboard</a>
            
            <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
            
            <p>Welcome aboard!<br>
            The TeamPlaymate Team</p>
        </div>
        <div class="footer">
            <p>© 2024 TeamPlaymate. All rights reserved.</p>
            <p>You're receiving this email because you subscribed to TeamPlaymate.</p>
        </div>
    </body>
    </html>
    `;
  }

  private generateWelcomeEmailText(data: WelcomeEmailData): string {
    return `
Welcome to TeamPlaymate!

Hello ${data.userName}!

Congratulations on subscribing to our ${data.planName} plan! We're excited to help you take your sports analytics to the next level.

Your ${data.planName} Plan Includes:
${data.planFeatures.map(feature => `• ${feature}`).join('\n')}

Ready to get started? Visit your dashboard: ${data.loginUrl}

If you have any questions or need assistance, don't hesitate to reach out to our support team.

Welcome aboard!
The TeamPlaymate Team

© 2024 TeamPlaymate. All rights reserved.
    `;
  }

  private generatePasswordRecoveryTemplate(data: PasswordRecoveryData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .token { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Reset your TeamPlaymate password</p>
        </div>
        <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>We received a request to reset your password for your TeamPlaymate account.</p>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in ${data.expiresIn}. If you didn't request this reset, please ignore this email.
            </div>
            
            <p>Click the button below to reset your password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="token">${data.resetUrl}</div>
            
            <p>If you're having trouble with the link above, contact our support team.</p>
            
            <p>Best regards,<br>
            TeamPlaymate Security Team</p>
        </div>
        <div class="footer">
            <p>© 2024 TeamPlaymate. All rights reserved.</p>
            <p>This is an automated security email.</p>
        </div>
    </body>
    </html>
    `;
  }

  private generatePasswordRecoveryText(data: PasswordRecoveryData): string {
    return `
Password Reset Request

Hello ${data.userName}!

We received a request to reset your password for your TeamPlaymate account.

⚠️ Security Notice: This link will expire in ${data.expiresIn}. If you didn't request this reset, please ignore this email.

Reset your password using this link: ${data.resetUrl}

If you're having trouble with the link above, contact our support team.

Best regards,
TeamPlaymate Security Team

© 2024 TeamPlaymate. All rights reserved.
    `;
  }

  private generatePaymentConfirmationTemplate(data: PaymentEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #27ae60; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .payment-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #27ae60; }
            .button { display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>💳 Payment Confirmed!</h1>
            <p>Thank you for your payment</p>
        </div>
        <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>We've successfully processed your payment for the ${data.planName} plan.</p>
            
            <div class="payment-details">
                <h3>Payment Details:</h3>
                <p><strong>Plan:</strong> ${data.planName}</p>
                <p><strong>Amount:</strong> ${data.currency.toUpperCase()} $${data.amount}</p>
                ${data.nextBillingDate ? `<p><strong>Next Billing Date:</strong> ${data.nextBillingDate}</p>` : ''}
            </div>
            
            ${data.invoiceUrl ? `<a href="${data.invoiceUrl}" class="button">Download Invoice</a>` : ''}
            
            <p>Your subscription is now active and you have full access to all ${data.planName} features.</p>
            
            <p>Thank you for choosing TeamPlaymate!</p>
            
            <p>Best regards,<br>
            The TeamPlaymate Team</p>
        </div>
        <div class="footer">
            <p>© 2024 TeamPlaymate. All rights reserved.</p>
            <p>Questions about your payment? Contact our billing support.</p>
        </div>
    </body>
    </html>
    `;
  }

  private generatePaymentConfirmationText(data: PaymentEmailData): string {
    return `
Payment Confirmed!

Hello ${data.userName}!

We've successfully processed your payment for the ${data.planName} plan.

Payment Details:
• Plan: ${data.planName}
• Amount: ${data.currency.toUpperCase()} $${data.amount}
${data.nextBillingDate ? `• Next Billing Date: ${data.nextBillingDate}` : ''}

${data.invoiceUrl ? `Download your invoice: ${data.invoiceUrl}` : ''}

Your subscription is now active and you have full access to all ${data.planName} features.

Thank you for choosing TeamPlaymate!

Best regards,
The TeamPlaymate Team

© 2024 TeamPlaymate. All rights reserved.
    `;
  }

  private generateAdminSubscriberTemplate(data: AdminNotificationData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Subscriber Alert</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3498db; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .user-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3498db; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🆕 New Subscriber!</h1>
            <p>Someone just joined TeamPlaymate</p>
        </div>
        <div class="content">
            <h2>New Subscription Alert</h2>
            <p>A new user has subscribed to TeamPlaymate!</p>
            
            <div class="user-details">
                <h3>Subscriber Details:</h3>
                <p><strong>Name:</strong> ${data.userName}</p>
                <p><strong>Email:</strong> ${data.userEmail}</p>
                <p><strong>Plan:</strong> ${data.planName}</p>
                <p><strong>Timestamp:</strong> ${data.timestamp}</p>
                ${data.userLocation ? `<p><strong>Location:</strong> ${data.userLocation}</p>` : ''}
            </div>
            
            <p>Welcome the new member to the TeamPlaymate community!</p>
        </div>
        <div class="footer">
            <p>© 2024 TeamPlaymate Admin System</p>
        </div>
    </body>
    </html>
    `;
  }

  private generateAdminSubscriberText(data: AdminNotificationData): string {
    return `
New Subscriber Alert!

A new user has subscribed to TeamPlaymate!

Subscriber Details:
• Name: ${data.userName}
• Email: ${data.userEmail}
• Plan: ${data.planName}
• Timestamp: ${data.timestamp}
${data.userLocation ? `• Location: ${data.userLocation}` : ''}

Welcome the new member to the TeamPlaymate community!

© 2024 TeamPlaymate Admin System
    `;
  }

  private generateAdminPaymentTemplate(data: AdminNotificationData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Received</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f39c12; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .payment-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f39c12; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>💰 Payment Received!</h1>
            <p>New payment processed successfully</p>
        </div>
        <div class="content">
            <h2>Payment Notification</h2>
            <p>A payment has been successfully processed!</p>
            
            <div class="payment-details">
                <h3>Payment Details:</h3>
                <p><strong>Customer:</strong> ${data.userName}</p>
                <p><strong>Email:</strong> ${data.userEmail}</p>
                <p><strong>Plan:</strong> ${data.planName}</p>
                <p><strong>Amount:</strong> ${data.currency?.toUpperCase()} $${data.amount}</p>
                <p><strong>Timestamp:</strong> ${data.timestamp}</p>
                ${data.userLocation ? `<p><strong>Location:</strong> ${data.userLocation}</p>` : ''}
            </div>
            
            <p>The payment has been processed and the customer's subscription is now active.</p>
        </div>
        <div class="footer">
            <p>© 2024 TeamPlaymate Admin System</p>
        </div>
    </body>
    </html>
    `;
  }

  private generateAdminPaymentText(data: AdminNotificationData): string {
    return `
Payment Received!

A payment has been successfully processed!

Payment Details:
• Customer: ${data.userName}
• Email: ${data.userEmail}
• Plan: ${data.planName}
• Amount: ${data.currency?.toUpperCase()} $${data.amount}
• Timestamp: ${data.timestamp}
${data.userLocation ? `• Location: ${data.userLocation}` : ''}

The payment has been processed and the customer's subscription is now active.

© 2024 TeamPlaymate Admin System
    `;
  }

  private generateRecoverySuccessTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #27ae60; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✅ Password Reset Successful!</h1>
            <p>Your password has been updated</p>
        </div>
        <div class="content">
            <h2>Hello ${userName}!</h2>
            
            <div class="success">
                <strong>✅ Success!</strong> Your password has been successfully reset.
            </div>
            
            <p>Your TeamPlaymate account password has been successfully updated. You can now log in with your new password.</p>
            
            <p>If you didn't make this change, please contact our support team immediately.</p>
            
            <p>For your security, we recommend:</p>
            <ul>
                <li>Using a strong, unique password</li>
                <li>Enabling two-factor authentication</li>
                <li>Keeping your account information up to date</li>
            </ul>
            
            <p>Thank you for keeping your account secure!</p>
            
            <p>Best regards,<br>
            TeamPlaymate Security Team</p>
        </div>
        <div class="footer">
            <p>© 2024 TeamPlaymate. All rights reserved.</p>
            <p>This is an automated security notification.</p>
        </div>
    </body>
    </html>
    `;
  }

  private generateRecoverySuccessText(userName: string): string {
    return `
Password Reset Successful!

Hello ${userName}!

✅ Success! Your password has been successfully reset.

Your TeamPlaymate account password has been successfully updated. You can now log in with your new password.

If you didn't make this change, please contact our support team immediately.

For your security, we recommend:
• Using a strong, unique password
• Enabling two-factor authentication
• Keeping your account information up to date

Thank you for keeping your account secure!

Best regards,
TeamPlaymate Security Team

© 2024 TeamPlaymate. All rights reserved.
    `;
  }
}

// Email automation service
class EmailAutomationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async initialize(): Promise<boolean> {
    return await this.emailService.verifyConnection();
  }

  // Handle new subscription
  async handleNewSubscription(userData: {
    userId: string;
    userName: string;
    userEmail: string;
    planName: string;
    planFeatures: string[];
    userLocation?: string;
  }): Promise<void> {
    try {
      // Send welcome email to user
      await this.emailService.sendWelcomeEmail({
        userName: userData.userName,
        userEmail: userData.userEmail,
        planName: userData.planName,
        planFeatures: userData.planFeatures,
        loginUrl: `${process.env.VITE_FRONTEND_URL}/dashboard`
      });

      // Send admin notification
      await this.emailService.sendAdminNewSubscriberNotification({
        userName: userData.userName,
        userEmail: userData.userEmail,
        planName: userData.planName,
        timestamp: new Date().toISOString(),
        userLocation: userData.userLocation
      });

      console.log(`Subscription emails sent for user: ${userData.userEmail}`);
    } catch (error) {
      console.error('Failed to handle new subscription emails:', error);
    }
  }

  // Handle payment received
  async handlePaymentReceived(paymentData: {
    userName: string;
    userEmail: string;
    planName: string;
    amount: number;
    currency: string;
    invoiceUrl?: string;
    nextBillingDate?: string;
    userLocation?: string;
  }): Promise<void> {
    try {
      // Send payment confirmation to user
      await this.emailService.sendPaymentConfirmationEmail({
        userName: paymentData.userName,
        userEmail: paymentData.userEmail,
        planName: paymentData.planName,
        amount: paymentData.amount,
        currency: paymentData.currency,
        invoiceUrl: paymentData.invoiceUrl,
        nextBillingDate: paymentData.nextBillingDate
      });

      // Send admin notification
      await this.emailService.sendAdminPaymentNotification({
        userName: paymentData.userName,
        userEmail: paymentData.userEmail,
        planName: paymentData.planName,
        amount: paymentData.amount,
        currency: paymentData.currency,
        timestamp: new Date().toISOString(),
        userLocation: paymentData.userLocation
      });

      console.log(`Payment emails sent for user: ${paymentData.userEmail}`);
    } catch (error) {
      console.error('Failed to handle payment emails:', error);
    }
  }

  // Handle password recovery request
  async handlePasswordRecovery(userId: string, email: string, userName: string): Promise<string | null> {
    try {
      const success = await this.emailService.sendPasswordRecoveryEmail(userId, email, userName);
      return success ? 'Recovery email sent successfully' : null;
    } catch (error) {
      console.error('Failed to handle password recovery:', error);
      return null;
    }
  }

  // Handle password reset success
  async handlePasswordResetSuccess(email: string, userName: string): Promise<void> {
    try {
      await this.emailService.sendAccountRecoverySuccessEmail(email, userName);
      console.log(`Password reset success email sent to: ${email}`);
    } catch (error) {
      console.error('Failed to send password reset success email:', error);
    }
  }

  // Validate recovery token
  validateRecoveryToken(token: string) {
    return this.emailService.validateRecoveryToken(token);
  }

  // Use recovery token
  useRecoveryToken(token: string): boolean {
    return this.emailService.useRecoveryToken(token);
  }
}

// Export singleton instances
export const emailService = new EmailService();
export const emailAutomationService = new EmailAutomationService();

// Export types for use in other modules
export type {
  EmailType,
  WelcomeEmailData,
  PasswordRecoveryData,
  PaymentEmailData,
  AdminNotificationData
};

// Initialize email service
export const initializeEmailService = async (): Promise<boolean> => {
  return await emailAutomationService.initialize();
};