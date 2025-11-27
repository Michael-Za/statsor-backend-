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

// Test email service status
async function testEmailService() {
  console.log('\n=== Testing Email Service Status ===');
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/email',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('Email Service Status:', response.statusCode);
    console.log('Email Service Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Email Service Error:', error.message);
    return false;
  }
}

// Test welcome email
async function testWelcomeEmail() {
  console.log('\n=== Testing Welcome Email ===');
  try {
    const postData = JSON.stringify(testData.welcomeEmail);
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('Welcome Email Status:', response.statusCode);
    console.log('Welcome Email Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Welcome Email Error:', error.message);
    return false;
  }
}

// Test password reset email
async function testPasswordResetEmail() {
  console.log('\n=== Testing Password Reset Email ===');
  try {
    const postData = JSON.stringify(testData.passwordReset);
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('Password Reset Email Status:', response.statusCode);
    console.log('Password Reset Email Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Password Reset Email Error:', error.message);
    return false;
  }
}

// Test AI chat service status
async function testAIChatService() {
  console.log('\n=== Testing AI Chat Service Status ===');
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/ai-chat',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('AI Chat Service Status:', response.statusCode);
    console.log('AI Chat Service Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('AI Chat Service Error:', error.message);
    return false;
  }
}

// Test AI chat message
async function testAIChatMessage() {
  console.log('\n=== Testing AI Chat Message ===');
  try {
    const postData = JSON.stringify(testData.aiChat);
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/ai-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('AI Chat Message Status:', response.statusCode);
    console.log('AI Chat Message Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('AI Chat Message Error:', error.message);
    return false;
  }
}

// Test database service status
async function testDatabaseService() {
  console.log('\n=== Testing Database Service Status ===');
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/database?health=true',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('Database Service Status:', response.statusCode);
    console.log('Database Service Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Database Service Error:', error.message);
    return false;
  }
}

// Test API functionality
async function testAPI() {
  console.log('\n=== Testing API Endpoints ===');
  try {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/test',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('API Test Status:', response.statusCode);
    console.log('API Test Data:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('API Test Error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting comprehensive workflow tests...\n');
  
  const results = [];
  
  // Test basic services
  results.push(await testHealth());
  results.push(await testAPI());
  
  // Test email services
  results.push(await testEmailService());
  results.push(await testWelcomeEmail());
  results.push(await testPasswordResetEmail());
  
  // Test AI services
  results.push(await testAIChatService());
  results.push(await testAIChatMessage());
  
  // Test database services
  results.push(await testDatabaseService());
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.');
  }
  
  return passed === total;
}

// Run the tests
runAllTests()
  .then(success => {
    if (success) {
      console.log('\n✅ All workflow tests completed successfully!');
    } else {
      console.log('\n❌ Some workflow tests failed.');
    }
  })
  .catch(error => {
    console.error('Test suite error:', error);
  });