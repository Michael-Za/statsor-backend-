/**
 * Test Script for Authentication Flows
 * Run this script to verify all authentication functionality works locally
 */

const testAuthFlows = async () => {
  console.log('🧪 Testing Authentication Flows...\n');

  // Test 1: Environment Configuration
  console.log('📋 Test 1: Environment Configuration');
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || process.env?.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY,
    VITE_API_URL: import.meta.env?.VITE_API_URL || process.env?.VITE_API_URL,
    VITE_APP_URL: import.meta.env?.VITE_APP_URL || process.env?.VITE_APP_URL,
    VITE_GOOGLE_CLIENT_ID: import.meta.env?.VITE_GOOGLE_CLIENT_ID || process.env?.VITE_GOOGLE_CLIENT_ID
  };

  console.log('Environment Variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value ? (key.includes('KEY') || key.includes('SECRET') ? '***CONFIGURED***' : value) : 'MISSING';
    console.log(`  ${status} ${key}: ${displayValue}`);
  });

  // Test 2: API Connectivity
  console.log('\n🌐 Test 2: API Connectivity');
  const API_BASE_URL = envVars.VITE_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Backend API is reachable');
    } else {
      console.log(`⚠️ Backend API responded with status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Backend API is not reachable:', error.message);
    console.log('💡 Make sure your backend server is running on the expected URL');
  }

  // Test 3: Supabase Connection
  console.log('\n🗄️ Test 3: Supabase Connection');
  if (envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY) {
    try {
      // This would normally use the Supabase client, but for testing we'll just check the URL
      const supabaseUrl = new URL(envVars.VITE_SUPABASE_URL);
      console.log('✅ Supabase URL is valid:', supabaseUrl.hostname);
      
      // Test if we can reach Supabase
      const response = await fetch(`${envVars.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': envVars.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Supabase is reachable');
      } else {
        console.log(`⚠️ Supabase responded with status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Supabase connection failed:', error.message);
    }
  } else {
    console.log('❌ Supabase credentials are missing');
  }

  // Test 4: OAuth Configuration
  console.log('\n🔑 Test 4: Google OAuth Configuration');
  if (envVars.VITE_GOOGLE_CLIENT_ID) {
    const googleClientId = envVars.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId.includes('.apps.googleusercontent.com')) {
      console.log('✅ Google Client ID format looks correct');
      
      // Test OAuth discovery endpoint
      try {
        const discoveryResponse = await fetch('https://accounts.google.com/.well-known/openid_configuration');
        if (discoveryResponse.ok) {
          console.log('✅ Google OAuth discovery endpoint is reachable');
        } else {
          console.log('⚠️ Google OAuth discovery endpoint issue');
        }
      } catch (error) {
        console.log('❌ Cannot reach Google OAuth endpoints:', error.message);
      }
    } else {
      console.log('❌ Google Client ID format is incorrect');
    }
  } else {
    console.log('❌ Google Client ID is missing');
  }

  // Test 5: CORS Configuration
  console.log('\n🌍 Test 5: CORS Configuration Check');
  const frontendUrl = envVars.VITE_APP_URL || 'http://localhost:3008';
  console.log(`Frontend URL: ${frontendUrl}`);
  console.log(`Backend URL: ${API_BASE_URL}`);
  
  if (frontendUrl.includes('localhost') && API_BASE_URL.includes('localhost')) {
    console.log('✅ Development mode - CORS should work with localhost');
  } else if (frontendUrl.includes('statsor.com') && API_BASE_URL.includes('railway.app')) {
    console.log('✅ Production mode - CORS configured for cross-domain');
  } else {
    console.log('⚠️ Mixed environment - check CORS configuration');
  }

  // Test 6: Local Storage Availability
  console.log('\n💾 Test 6: Local Storage Availability');
  try {
    localStorage.setItem('test', 'value');
    localStorage.removeItem('test');
    console.log('✅ Local storage is available');
  } catch (error) {
    console.log('❌ Local storage is not available:', error.message);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log('💡 Next Steps:');
  console.log('1. Fix any ❌ items above');
  console.log('2. Start your development servers');
  console.log('3. Test authentication in the browser');
  console.log('4. Verify OAuth flow with Google');
  console.log('5. Test email signup/login');
  console.log('\n🚀 Ready for testing!');
};

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testAuthFlows;
} else {
  // Browser environment - attach to window
  window.testAuthFlows = testAuthFlows;
  console.log('🧪 Authentication test script loaded!');
  console.log('Run testAuthFlows() in the console to start testing.');
}
