const { createClient } = require('@supabase/supabase-js');

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://kieihchqtyqquvispker.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWloY2hxdHlxcXV2aXNwa2VyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYzMjI5MSwiZXhwIjoyMDc2MjA4MjkxfQ.-4v3qy2vXBDNg_D5H3V5u1zOSDQveFNDPi-aCD-TSq0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test connection by listing tables
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    if (data) {
      console.log('Found players table with data');
    } else {
      console.log('Connected to Supabase but players table does not exist yet');
    }
    return true;
  } catch (error) {
    console.log('❌ Supabase test failed:', error.message);
    return false;
  }
}

// Run the test
testSupabase().then(success => {
  if (success) {
    console.log('\n🎉 Supabase service is working correctly!');
  } else {
    console.log('\n⚠️  Supabase service needs configuration.');
  }
});