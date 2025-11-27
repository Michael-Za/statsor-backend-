const { Resend } = require('resend');

// Get the Resend API key from environment variables
const resendApiKey = process.env.RESEND_API_KEY || 're_WsMKhaDk_6v8sMfY9sDcX7xCahtYzDgjt';
const resend = new Resend(resendApiKey);

async function testEmail() {
  try {
    console.log('Testing Resend email service...');
    
    // Send a simple test email using your verified subdomain
    const result = await resend.emails.send({
      from: 'no-reply@info.statsor.com', // Using your verified subdomain
      to: 'statsor1@gmail.com', // Change this to your email for testing
      subject: 'Test Email from StatSor Backend',
      html: '<h1>Test Email</h1><p>This is a test email from the StatSor backend services.</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
    return true;
  } catch (error) {
    console.log('❌ Email test failed:', error.message);
    return false;
  }
}

// Run the test
testEmail().then(success => {
  if (success) {
    console.log('\n🎉 Email service is working correctly!');
  } else {
    console.log('\n⚠️  Email service needs configuration.');
  }
});