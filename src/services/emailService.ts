import { Resend } from 'resend';

interface EmailData {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface WelcomeEmailData {
  name: string;
  email: string;
}

interface PasswordResetEmailData {
  name: string;
  email: string;
  resetCode?: string;
  resetUrl?: string;
}

interface EmailUserInfo {
  name?: string;
  email?: string;
  id?: string;
  role?: string;
  created_at?: string;
  [key: string]: unknown;
}

class EmailService {
  private apiKey: string;
  private apiUrl: string;
  private resendApiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = import.meta.env?.['VITE_EMAIL_API_KEY'] || 'demo-key';
    this.apiUrl = import.meta.env?.['VITE_EMAIL_API_URL'] || 'https://api.emailservice.com/v1';
    this.resendApiKey = import.meta.env?.['VITE_RESEND_API_KEY'] || '';
    this.fromEmail = import.meta.env?.['VITE_EMAIL_FROM'] || 'no-reply@statsor.com';
  }

  async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      // In production, this would call your actual email service (SendGrid, Mailgun, etc.)
      // For now, we'll try to use Resend if available, otherwise fallback to demo
      if (this.resendApiKey) {
        const success = await this.sendResendEmail(emailData.to, emailData.subject, emailData.body);
        const response: EmailResponse = { success };
        if (success) {
          response.messageId = 'resend-' + Date.now();
        }
        return response;
      }

      const response = await fetch(`${this.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailData.to,
          from: emailData.from || 'noreply@statsor.com',
          subject: emailData.subject,
          html: this.formatEmailBody(emailData.body),
          text: emailData.body,
          replyTo: emailData.replyTo
        })
      });

      if (!response.ok) {
        throw new Error(`Email service responded with status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.messageId || 'demo-message-id'
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResponse> {
    const emailData: EmailData = {
      to: data.email,
      subject: 'Welcome to Statsor!',
      body: `
        <h1>Welcome to Statsor, ${data.name}!</h1>
        <p>We're excited to have you on board. Statsor is your all-in-one platform for sports statistics and team management.</p>
        <p>Get started by setting up your profile and exploring the dashboard.</p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <br>
        <p>Best regards,</p>
        <p>The Statsor Team</p>
      `
    };
    return this.sendEmail(emailData);
  }

  async sendSupportEmail(issue: string, userInfo: EmailUserInfo, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<EmailResponse> {
    const emailData: EmailData = {
      to: 'support@statsor.com',
      subject: `Support Request: ${issue.substring(0, 50)}...`,
      body: this.formatSupportEmail(issue, userInfo, priority)
    };

    return this.sendEmail(emailData);
  }

  private formatEmailBody(body: string): string {
    // Convert plain text to HTML with basic formatting
    return body
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  private formatSuggestionEmail(suggestion: string, userInfo: EmailUserInfo, context: string): string {
    return `
<h2>New Platform Suggestion</h2>

<h3>Suggestion Details:</h3>
<p><strong>Context:</strong> ${context}</p>
<p><strong>Suggestion:</strong></p>
<blockquote style="border-left: 4px solid #4ADE80; padding-left: 16px; margin: 16px 0;">
  ${suggestion}
</blockquote>

<h3>User Information:</h3>
<ul>
  <li><strong>Name:</strong> ${userInfo.name || 'Anonymous'}</li>
  <li><strong>Email:</strong> ${userInfo.email || 'Not provided'}</li>
  <li><strong>User ID:</strong> ${userInfo.id || 'Guest'}</li>
  <li><strong>Role:</strong> ${userInfo.role || 'User'}</li>
  <li><strong>Account Created:</strong> ${userInfo.created_at || 'Unknown'}</li>
</ul>

<h3>Technical Details:</h3>
<ul>
  <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
  <li><strong>User Agent:</strong> ${navigator.userAgent}</li>
  <li><strong>Page URL:</strong> ${window.location.href}</li>
  <li><strong>Screen Resolution:</strong> ${screen.width}x${screen.height}</li>
</ul>

<hr>
<p><em>This suggestion was submitted through the Statsor AI chatbot system.</em></p>
    `;
  }

  private formatSupportEmail(issue: string, userInfo: EmailUserInfo, priority: string): string {
    return `
<h2>Support Request - ${priority.toUpperCase()} Priority</h2>

<h3>Issue Description:</h3>
<blockquote style="border-left: 4px solid #EF4444; padding-left: 16px; margin: 16px 0;">
  ${issue}
</blockquote>

<h3>User Information:</h3>
<ul>
  <li><strong>Name:</strong> ${userInfo.name || 'Anonymous'}</li>
  <li><strong>Email:</strong> ${userInfo.email || 'Not provided'}</li>
  <li><strong>User ID:</strong> ${userInfo.id || 'Guest'}</li>
  <li><strong>Account Type:</strong> ${userInfo.role || 'User'}</li>
</ul>

<h3>Technical Context:</h3>
<ul>
  <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
  <li><strong>Browser:</strong> ${navigator.userAgent}</li>
  <li><strong>Current Page:</strong> ${window.location.href}</li>
  <li><strong>Local Time:</strong> ${new Date().toLocaleString()}</li>
</ul>

<hr>
<p><em>This support request was submitted through the Statsor AI assistant.</em></p>
    `;
  }

  private formatFeedbackEmail(feedback: string, userInfo: EmailUserInfo, rating?: number): string {
    return `
<h2>User Feedback${rating ? ` - ${rating}/5 Stars` : ''}</h2>

<h3>Feedback:</h3>
<blockquote style="border-left: 4px solid #4ADE80; padding-left: 16px; margin: 16px 0;">
  ${feedback}
</blockquote>

${rating ? `<h3>Rating:</h3><p>${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)</p>` : ''}

<h3>User Information:</h3>
<ul>
  <li><strong>Name:</strong> ${userInfo.name || 'Anonymous'}</li>
  <li><strong>Email:</strong> ${userInfo.email || 'Not provided'}</li>
  <li><strong>User ID:</strong> ${userInfo.id || 'Guest'}</li>
  <li><strong>Experience Level:</strong> ${userInfo.role || 'User'}</li>
</ul>

<h3>Context:</h3>
<ul>
  <li><strong>Submitted:</strong> ${new Date().toISOString()}</li>
  <li><strong>Platform:</strong> ${navigator.platform}</li>
  <li><strong>Page:</strong> ${window.location.href}</li>
</ul>

<hr>
<p><em>This feedback was collected through the Statsor AI chatbot system.</em></p>
    `;
  }

  // Utility method to validate email addresses
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Method to get email templates
  getEmailTemplates() {
    return {
      suggestion: {
        subject: 'New Platform Suggestion',
        priority: 'medium'
      },
      support: {
        subject: 'Support Request',
        priority: 'high'
      },
      feedback: {
        subject: 'User Feedback',
        priority: 'low'
      }
    };
  }

  private async sendResendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.resendApiKey) {
      console.warn('Resend API key not configured, skipping email send');
      return false;
    }

    try {
      const resend = new Resend(this.resendApiKey);
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html
      });

      if (error) {
        console.error('Resend API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending email with Resend:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();