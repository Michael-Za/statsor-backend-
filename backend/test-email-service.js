#!/usr/bin/env node

/**
 * Resend Email Service Test Script
 * 
 * Usage:
 *   node test-email-service.js                    # Check status
 *   node test-email-service.js test your@email.com # Send test email
 *   node test-email-service.js welcome your@email.com John Doe # Send welcome email
 */

require('dotenv').config();
const emailService = require('./src/services/emailService');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkStatus() {
  log('\n📧 Resend Email Service Status Check\n', 'cyan');
  
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@statsor.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Statsor Team';
  
  log('Configuration:', 'blue');
  log(`  API Key: ${apiKey ? '✅ Set' : '❌ Not set'}`, apiKey ? 'green' : 'red');
  log(`  From Email: ${fromEmail}`, 'blue');
  log(`  From Name: ${fromName}`, 'blue');
  log(`  Service Status: ${emailService.resend ? '✅ Initialized' : '❌ Not initialized'}`, emailService.resend ? 'green' : 'red');
  
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    log('\n⚠️  Warning: Resend API key not configured', 'yellow');
    log('Get your API key from: https://resend.com/api-keys', 'yellow');
    log('Add it to backend/.env as: RESEND_API_KEY=re_your_key_here', 'yellow');
  } else if (emailService.resend) {
    log('\n✅ Email service is ready to use!', 'green');
  }
  
  log('');
}

async function sendTestEmail(email) {
  log(`\n📧 Sending test email to: ${email}\n`, 'cyan');
  
  try {
    const result = await emailService.testEmail(email);
    
    if (result.success) {
      log('✅ Test email sent successfully!', 'green');
      log(`   Message ID: ${result.messageId}`, 'blue');
      log(`\n📬 Check your inbox at: ${email}`, 'cyan');
    } else {
      log('❌ Failed to send test email', 'red');
      log(`   Error: ${result.error}`, 'red');
    }
  } catch (error) {
    log('❌ Error sending test email:', 'red');
    log(`   ${error.message}`, 'red');
  }
  
  log('');
}

async function sendWelcomeEmail(email, firstName, lastName) {
  log(`\n📧 Sending welcome email to: ${email}\n`, 'cyan');
  
  try {
    const result = await emailService.sendWelcomeEmail({
      email,
      first_name: firstName || 'User',
      last_name: lastName || '',
      sport: 'football',
      role: 'player'
    });
    
    if (result.success) {
      log('✅ Welcome email sent successfully!', 'green');
      log(`   Message ID: ${result.messageId}`, 'blue');
      log(`\n📬 Check your inbox at: ${email}`, 'cyan');
    } else {
      log('❌ Failed to send welcome email', 'red');
      log(`   Error: ${result.error}`, 'red');
    }
  } catch (error) {
    log('❌ Error sending welcome email:', 'red');
    log(`   ${error.message}`, 'red');
  }
  
  log('');
}

function showHelp() {
  log('\n📧 Resend Email Service Test Script\n', 'cyan');
  log('Usage:', 'blue');
  log('  node test-email-service.js                              # Check status', 'blue');
  log('  node test-email-service.js test your@email.com          # Send test email', 'blue');
  log('  node test-email-service.js welcome your@email.com John  # Send welcome email', 'blue');
  log('');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'status') {
    await checkStatus();
  } else if (command === 'test') {
    const email = args[1];
    if (!email) {
      log('❌ Error: Email address required', 'red');
      log('Usage: node test-email-service.js test your@email.com', 'yellow');
      process.exit(1);
    }
    await sendTestEmail(email);
  } else if (command === 'welcome') {
    const email = args[1];
    const firstName = args[2];
    const lastName = args[3];
    
    if (!email) {
      log('❌ Error: Email address required', 'red');
      log('Usage: node test-email-service.js welcome your@email.com [FirstName] [LastName]', 'yellow');
      process.exit(1);
    }
    await sendWelcomeEmail(email, firstName, lastName);
  } else if (command === 'help' || command === '-h' || command === '--help') {
    showHelp();
  } else {
    log(`❌ Unknown command: ${command}`, 'red');
    showHelp();
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
