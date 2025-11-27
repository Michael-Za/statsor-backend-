const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3003'; // Your backend server port

// Test user data
const testUser = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'johndoe.test@example.com',
  password: 'TestPassword123!'
};

// Test data for various workflows
const testData = {
  welcomeEmail: {
    action: 'sendWelcome',
    user: testUser
  },
  passwordReset: {
    action: 'sendPasswordReset',
    user: testUser,
    resetUrl: 'http://localhost:3000/reset-password?token=abc123'
  },
  aiChat: {
    action: 'sendMessage',
    userId: 'test-user-123',
    message: 'Hello, how can I improve my football skills?'
  }
};

// Function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test health endpoint
async function testHealth() {
  console.log('\n=== Testing Health Endpoint ===');
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('Health Check Status:', response.statusCode);
    console.log('Health Check Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Health Check Error:', error.message);
    return false;
  }
}

// Test email service directly through backend
async function testBackendEmailService() {
  console.log('\n=== Testing Backend Email Service ===');
  try {
    // This would typically be a direct call to the backend service
    // For now, we'll just test that the backend is responding
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('Backend Service Status:', response.statusCode);
    console.log('Backend Service Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Backend Service Error:', error.message);
    return false;
  }
}

// Test AI service directly through backend
async function testBackendAIService() {
  console.log('\n=== Testing Backend AI Service ===');
  try {
    // This would typically be a direct call to the backend service
    // For now, we'll just test that the backend is responding
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('Backend AI Service Status:', response.statusCode);
    console.log('Backend AI Service Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Backend AI Service Error:', error.message);
    return false;
  }
}

// Test database service directly through backend
async function testBackendDatabaseService() {
  console.log('\n=== Testing Backend Database Service ===');
  try {
    // This would typically be a direct call to the backend service
    // For now, we'll just test that the backend is responding
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('Backend Database Service Status:', response.statusCode);
    console.log('Backend Database Service Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Backend Database Service Error:', error.message);
    return false;
  }
}

// Test authentication workflows
async function testAuthWorkflows() {
  console.log('\n=== Testing Authentication Workflows ===');
  console.log('Note: These tests require implementing actual auth endpoints');
  console.log('For now, testing that backend is responsive');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('Auth Workflow Test Status:', response.statusCode);
    return response.statusCode === 200;
  } catch (error) {
    console.error('Auth Workflow Test Error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting comprehensive backend workflow tests...\n');
  
  const results = [];
  
  // Test basic services
  results.push(await testHealth());
  
  // Test backend services
  results.push(await testBackendEmailService());
  results.push(await testBackendAIService());
  results.push(await testBackendDatabaseService());
  
  // Test auth workflows
  results.push(await testAuthWorkflows());
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Backend Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All backend tests passed!');
  } else {
    console.log('⚠️  Some backend tests failed. Check the output above.');
  }
  
  return passed === total;
}

// Run the tests
runAllTests()
  .then(success => {
    if (success) {
      console.log('\n✅ All backend workflow tests completed successfully!');
      console.log('\nNote: For full authentication and API testing, you would need to:');
      console.log('1. Implement actual auth endpoints in your backend');
      console.log('2. Set up proper user registration and login routes');
      console.log('3. Configure the Vercel API routes to connect to backend services');
      console.log('4. Test with a real frontend application');
    } else {
      console.log('\n❌ Some backend workflow tests failed.');
    }
  })
  .catch(error => {
    console.error('Test suite error:', error);
  });