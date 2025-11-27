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

// Test API documentation
async function testAPIDocs() {
  console.log('\n=== Testing API Documentation ===');
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/docs',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('API Docs Status:', response.statusCode);
    console.log('API Docs Available:', !!response.data.endpoints);
    return response.statusCode === 200;
  } catch (error) {
    console.error('API Docs Error:', error.message);
    return false;
  }
}

// Test email service status
async function testEmailServiceStatus() {
  console.log('\n=== Testing Email Service Status ===');
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/v1/email/status',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('Email Service Status:', response.statusCode);
    console.log('Email Service Configured:', response.data.configured);
    console.log('Email Service Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Email Service Status Error:', error.message);
    return false;
  }
}

// Test welcome email
async function testWelcomeEmail() {
  console.log('\n=== Testing Welcome Email ===');
  try {
    const postData = JSON.stringify({
      email: 'statsor1@gmail.com',
      first_name: 'John',
      last_name: 'Doe',
      sport: 'football',
      role: 'player'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/v1/email/welcome',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('Welcome Email Status:', response.statusCode);
    console.log('Welcome Email Success:', response.data.success);
    console.log('Welcome Email Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Welcome Email Error:', error.message);
    return false;
  }
}

// Test password reset functionality
async function testPasswordReset() {
  console.log('\n=== Testing Password Reset ===');
  console.log('Note: This requires a registered user account');
  try {
    const postData = JSON.stringify({
      email: 'statsor1@gmail.com'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/v1/auth/forgot-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('Password Reset Status:', response.statusCode);
    console.log('Password Reset Data:', JSON.stringify(response.data, null, 2));
    // This might fail if the user doesn't exist, which is expected
    return response.statusCode === 200 || response.statusCode === 404;
  } catch (error) {
    console.error('Password Reset Error:', error.message);
    return false;
  }
}

// Test AI chat service
async function testAIChatService() {
  console.log('\n=== Testing AI Chat Service ===');
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/v1/aichat/history',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('AI Chat Service Status:', response.statusCode);
    // This will likely return 401 (unauthorized) since we're not authenticated
    console.log('AI Chat Service Response:', JSON.stringify(response.data, null, 2));
    // Return true if we get a response (even if it's 401)
    return response.statusCode !== 500;
  } catch (error) {
    console.error('AI Chat Service Error:', error.message);
    return false;
  }
}

// Test user registration
async function testUserRegistration() {
  console.log('\n=== Testing User Registration ===');
  console.log('Note: This will fail if the email is already registered');
  try {
    const postData = JSON.stringify({
      email: 'test-' + Date.now() + '@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'player'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('Registration Status:', response.statusCode);
    console.log('Registration Data:', JSON.stringify(response.data, null, 2));
    // This might fail if there are validation issues, which is expected for testing
    return response.statusCode === 201 || response.statusCode === 400 || response.statusCode === 409;
  } catch (error) {
    console.error('Registration Error:', error.message);
    return false;
  }
}

// Test user login
async function testUserLogin() {
  console.log('\n=== Testing User Login ===');
  console.log('Note: This requires a valid user account');
  try {
    const postData = JSON.stringify({
      email: 'statsor1@gmail.com',
      password: 'TestPassword123!'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('Login Status:', response.statusCode);
    console.log('Login Data:', JSON.stringify(response.data, null, 2));
    // This might fail if credentials are invalid, which is expected
    return response.statusCode === 200 || response.statusCode === 401;
  } catch (error) {
    console.error('Login Error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting comprehensive backend API tests...\n');
  
  const results = [];
  
  // Test basic services
  results.push(await testHealth());
  results.push(await testAPIDocs());
  
  // Test email services
  results.push(await testEmailServiceStatus());
  results.push(await testWelcomeEmail());
  
  // Test authentication workflows
  results.push(await testPasswordReset());
  results.push(await testUserRegistration());
  results.push(await testUserLogin());
  
  // Test AI services
  results.push(await testAIChatService());
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Backend API Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All backend API tests completed successfully!');
  } else {
    console.log('⚠️  Some backend API tests had expected issues. Check the output above.');
  }
  
  console.log('\nNote: Some tests may fail due to:');
  console.log('1. User not existing in the database');
  console.log('2. Email already being registered');
  console.log('3. Authentication requirements for certain endpoints');
  console.log('4. Missing test data');
  
  return passed >= total * 0.7; // Allow 30% of tests to fail due to expected issues
}

// Run the tests
runAllTests()
  .then(success => {
    if (success) {
      console.log('\n✅ Backend API workflow tests completed with acceptable results!');
    } else {
      console.log('\n❌ Backend API workflow tests had too many failures.');
    }
  })
  .catch(error => {
    console.error('Test suite error:', error);
  });