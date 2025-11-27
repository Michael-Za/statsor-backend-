require('dotenv').config();
const emailService = require('./src/services/emailService');

async function test() {
  console.log('Testing password reset email...');
  console.log('API Key:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
  
  const result = await emailService.sendPasswordResetCodeEmail(
    {
      email: 'michael.makram.zm@gmail.com',
      first_name: 'Michael'
    },
    '123456'
  );
  
  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
