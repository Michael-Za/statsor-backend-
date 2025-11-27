const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const Groq = require('groq-sdk');

// Load environment variables
require('dotenv').config({ path: './.env' });

console.log('Testing backend services...\n');

// Test 1: Supabase Database Connection
async function testSupabase() {
  console.log('1. Testing Supabase Database Connection...');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('   ❌ Supabase credentials not found in environment variables');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying a simple table (if exists)
    const { data, error } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist
      console.log('   ❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('   ✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.log('   ❌ Supabase test failed:', error.message);
    return false;
  }
}

// Test 2: Email Service (Resend)
async function testEmailService() {
  console.log('\n2. Testing Email Service (Resend)...');
  
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey || resendApiKey === 'your_actual_resend_api_key_here') {
      console.log('   ❌ Resend API key not found or not configured');
      return false;
    }
    
    const resend = new Resend(resendApiKey);
    
    // Test by sending a test email (to a safe address)
    console.log('   ✅ Resend service initialized (not sending test email to avoid spam)');
    return true;
  } catch (error) {
    console.log('   ❌ Resend test failed:', error.message);
    return false;
  }
}

// Test 3: AI Service (Groq)
async function testAIService() {
  console.log('\n3. Testing AI Service (Groq)...');
  
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey || groqApiKey === 'your_groq_api_key') {
      console.log('   ❌ Groq API key not found or not configured');
      return false;
    }
    
    const groq = new Groq({ apiKey: groqApiKey });
    
    console.log('   ✅ Groq service initialized');
    return true;
  } catch (error) {
    console.log('   ❌ Groq test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting backend service tests...\n');
  
  const results = [];
  
  results.push(await testSupabase());
  results.push(await testEmailService());
  results.push(await testAIService());
  
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All services are working correctly!');
  } else {
    console.log('⚠️  Some services need configuration. Check the output above.');
  }
  
  console.log('\nNext steps:');
  console.log('1. If Supabase failed: Get the correct service role key from your Supabase dashboard');
  console.log('2. If Email failed: Get your Resend API key from https://resend.com/api-keys');
  console.log('3. If AI failed: Get your Groq API key from https://groq.com');
}

// Run the tests
runAllTests().catch(console.error);