// test-backend-functionality.js
import http from 'http';

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Test endpoints
const testEndpoints = [
  { name: 'Health Check', path: '/health', expectedStatus: 200 },
  { name: 'Database Health', path: '/health/db', expectedStatus: 200 },
  { name: 'Redis Health', path: '/health/redis', expectedStatus: 200 },
  { name: 'API Documentation', path: '/api/docs', expectedStatus: 200 }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, BACKEND_URL);
    console.log(`Testing ${endpoint.name} at ${url.href}...`);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === endpoint.expectedStatus;
        resolve({
          name: endpoint.name,
          status: success ? 'PASS' : `FAIL (${res.statusCode})`,
          expected: endpoint.expectedStatus,
          received: res.statusCode,
          details: success ? 'OK' : `Expected ${endpoint.expectedStatus}, got ${res.statusCode}`
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name: endpoint.name,
        status: `FAIL (Connection Error)`,
        error: err.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        status: 'FAIL (Timeout)',
        error: 'Request timed out after 10 seconds'
      });
    });
  });
}

async function testBackendFunctionality() {
  console.log('🧪 Testing Backend Functionality');
  console.log('=====================================');
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  
  try {
    // Test all endpoints
    const results = [];
    for (const endpoint of testEndpoints) {
      const result = await testEndpoint(endpoint);
      results.push(result);
    }
    
    // Display results
    console.log('\n📋 Test Results:');
    console.log('-----------------');
    let passed = 0;
    let failed = 0;
    
    results.forEach(result => {
      const statusIcon = result.status.startsWith('PASS') ? '✅' : '❌';
      console.log(`${statusIcon} ${result.name}: ${result.status}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else if (!result.status.startsWith('PASS')) {
        console.log(`   Expected: ${result.expected}, Received: ${result.received}`);
      }
      
      if (result.status.startsWith('PASS')) {
        passed++;
      } else {
        failed++;
      }
    });
    
    console.log('\n📊 Summary:');
    console.log('-----------');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total:  ${results.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All backend functionality tests passed!');
      console.log('The backend is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the backend configuration.');
      console.log('\n🔧 Troubleshooting tips:');
      console.log('   1. Ensure the backend server is running (npm run dev in backend directory)');
      console.log('   2. Check that all environment variables are properly configured');
      console.log('   3. Verify database and Redis connections');
      console.log('   4. Check the backend logs for more detailed error information');
    }
    
  } catch (error) {
    console.error('❌ Error running tests:', error.message);
  }
}

// Run the tests
testBackendFunctionality();