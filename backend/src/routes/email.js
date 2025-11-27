const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

/**
 * Test email endpoint
 * GET /api/v1/email/test?email=your-email@example.com
 */
router.get('/test', async (req, res) => {
  try {
    const testEmail = req.query.email || 'test@example.com';
    
    console.log(`📧 Testing email service - sending to: ${testEmail}`);
    
    const result = await emailService.testEmail(testEmail);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message
    });
  }
});

/**
 * Send welcome email
 * POST /api/v1/email/welcome
 * Body: { email, first_name, last_name, sport, role }
 */
router.post('/welcome', async (req, res) => {
  try {
    const { email, first_name, last_name, sport, role } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const result = await emailService.sendWelcomeEmail({
      email,
      first_name: first_name || 'User',
      last_name: last_name || '',
      sport: sport || 'football',
      role: role || 'player'
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: `Welcome email sent to ${email}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Welcome email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email',
      error: error.message
    });
  }
});

/**
 * Send custom email
 * POST /api/v1/email/send
 * Body: { to, subject, html, text?, cc?, bcc?, replyTo? }
 */
router.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text, cc, bcc, replyTo } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'to, subject, and html are required'
      });
    }
    
    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      replyTo
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: `Email sent to ${to}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

/**
 * Check email service status
 * GET /api/v1/email/status
 */
router.get('/status', async (req, res) => {
  try {
    const isConfigured = !!emailService.resend;
    const apiKey = process.env.RESEND_API_KEY;
    
    res.json({
      success: true,
      configured: isConfigured,
      hasApiKey: !!apiKey && apiKey !== 'your_resend_api_key',
      fromEmail: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@statsor.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Statsor Team',
      message: isConfigured 
        ? 'Email service is configured and ready' 
        : 'Email service is not configured. Please add RESEND_API_KEY to your .env file'
    });
  } catch (error) {
    console.error('❌ Email status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email service status',
      error: error.message
    });
  }
});

module.exports = router;
