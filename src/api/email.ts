import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

// Import the email service
let EmailService: any;

import('../../backend/src/services/emailService')
  .then(module => {
    EmailService = module.default || module;
  })
  .catch(err => {
    console.warn('Could not load EmailService:', err);
  });

let emailService: any = null;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    // Initialize email service if not already done
    if (!emailService && EmailService) {
      emailService = new EmailService();
      // Give it a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const { action, ...data } = request.body;

    switch (request.method) {
      case 'POST':
        if (!emailService) {
          return response.status(500).json({ error: 'Email service not initialized' });
        }
        
        switch (action) {
          case 'sendWelcome':
            if (!data.user) {
              return response.status(400).json({ error: 'User data is required' });
            }
            const welcomeResult = await emailService.sendWelcomeEmail(data.user);
            return response.status(200).json(welcomeResult);

          case 'sendPasswordReset':
            if (!data.user || !data.resetUrl) {
              return response.status(400).json({ error: 'User and resetUrl are required' });
            }
            const resetResult = await emailService.sendPasswordResetEmail(data.user, data.resetUrl);
            return response.status(200).json(resetResult);

          case 'test':
            const testResult = await emailService.testEmail(data.toEmail);
            return response.status(200).json(testResult);

          default:
            return response.status(400).json({ error: 'Invalid action' });
        }

      case 'GET':
        // Check email service status
        const status = {
          initialized: !!emailService,
          hasApiKey: !!(process.env['RESEND_API_KEY'] && process.env['RESEND_API_KEY'] !== 'your_resend_api_key'),
          fromEmail: process.env['RESEND_FROM_EMAIL'] || process.env['EMAIL_FROM'] || 'noreply@statsor.com'
        };
        return response.status(200).json({ status });

      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in email API:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}