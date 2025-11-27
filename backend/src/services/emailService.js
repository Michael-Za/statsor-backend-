const { Resend } = require('resend');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.resend = null;
    this.initializeResend();
  }

  async initializeResend() {
    try {
      // Check if Resend API key is configured
      const apiKey = process.env.RESEND_API_KEY;

      if (!apiKey || apiKey === 'your_resend_api_key') {
        console.log('⚠️ Email service disabled - no valid Resend API key configured');
        console.log('💡 Get your API key from: https://resend.com/api-keys');
        this.resend = null;
        return;
      }

      // Initialize Resend client
      this.resend = new Resend(apiKey);
      console.log('✅ Email service initialized successfully with Resend SDK');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.log('⚠️ Email service disabled - continuing without email functionality');
      this.resend = null;
    }
  }

  async sendEmail(options) {
    try {
      if (!this.resend) {
        console.log('⚠️ Email service not available - skipping email send');
        return { success: false, error: 'Email service not configured' };
      }

      const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@statsor.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'Statsor Team';

      const emailData = {
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      // Add optional fields if provided
      if (options.cc) emailData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      if (options.bcc) emailData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      if (options.replyTo) emailData.reply_to = options.replyTo;
      if (options.tags) emailData.tags = options.tags;

      const result = await this.resend.emails.send(emailData);

      if (result.error) {
        console.error('❌ Resend API error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log(`✅ Email sent successfully to ${options.to}:`, result.data.id);
      return { success: true, messageId: result.data.id };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(user) {
    try {
      // Register Handlebars helpers
      handlebars.registerHelper('eq', (a, b) => a === b);

      const templatePath = path.join(__dirname, '../templates/welcome-email.hbs');
      const templateSource = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      const html = template({
        firstName: user.first_name || user.name || 'User',
        lastName: user.last_name || '',
        email: user.email,
        appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        supportEmail: 'statsor1@gmail.com',
        year: new Date().getFullYear(),
        sport: user.sport || 'football',
        role: user.role || 'player'
      });

      return await this.sendEmail({
        to: user.email,
        subject: '🎉 Welcome to Statsor - Your Football Management Journey Begins!',
        html
      });
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    try {
      const templatePath = path.join(__dirname, '../templates/password-reset-email.hbs');
      const templateSource = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      const html = template({
        firstName: user.first_name || user.name || 'User',
        resetUrl,
        appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        supportEmail: 'statsor1@gmail.com',
        year: new Date().getFullYear(),
        expiryTime: '1 hour'
      });

      return await this.sendEmail({
        to: user.email,
        subject: '🔐 Reset Your Statsor Password',
        html
      });
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(user, verificationToken) {
    try {
      const templatePath = path.join(__dirname, '../templates/verification-email.hbs');
      const templateSource = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

      const html = template({
        firstName: user.first_name || user.name || 'User',
        verificationUrl,
        verificationToken,
        appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        supportEmail: 'statsor1@gmail.com',
        year: new Date().getFullYear()
      });

      return await this.sendEmail({
        to: user.email,
        subject: '✅ Verify Your Statsor Account',
        html
      });
    } catch (error) {
      console.error('❌ Failed to send verification email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetCodeEmail(user, resetCode) {
    try {
      const templatePath = path.join(__dirname, '../templates/password-reset-code-email.hbs');
      const templateSource = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      const html = template({
        firstName: user.first_name || user.name || 'User',
        resetCode,
        appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        supportEmail: 'statsor1@gmail.com',
        year: new Date().getFullYear(),
        expiryTime: '15 minutes',
        email: user.email,
        requestTime: new Date().toLocaleString(),
        ipAddress: 'Hidden for security',
        userAgent: 'Hidden for security'
      });

      return await this.sendEmail({
        to: user.email,
        subject: '🔑 Your Statsor Password Reset Code',
        html
      });
    } catch (error) {
      console.error('❌ Failed to send password reset code email:', error.message);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Test email functionality
  async testEmail(toEmail = 'statsor1@gmail.com') {
    try {
      const result = await this.sendEmail({
        to: toEmail,
        subject: '🧪 Statsor Email Service Test',
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email from Statsor platform.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <p>If you receive this, the email service is working correctly!</p>
        `
      });
      return result;
    } catch (error) {
      console.error('❌ Email test failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
