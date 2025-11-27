// Simple test script to verify API endpoints
const https = require('https');

// Test data
const testEmailData = {
  action: 'test',
  toEmail: 'statsor1@gmail.com'
};

const testChatData = {
  action: 'sendMessage',
  userId: 'test-user-123',
  message: 'Hello, how can I improve my football skills?'
};

const testData = {
  action: 'test'
};

// Function to test an endpoint
function testEndpoint(path, data, method = 'POST') {
  const postData = JSON.stringify(data);
  
  const options = {
    hostname: 'localhost',
    port: 3000, // Vercel default port
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`${method} ${path} - Status: ${res.statusCode}`);
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });
  });

  req.on('error', (error) => {
    console.error(`${method} ${path} - Error: ${error.message}`);
  });

  if (method === 'POST') {
    req.write(postData);
  }
  req.end();
}

// Test the endpoints
console.log('Testing API endpoints...');
testEndpoint('/api/email', testEmailData);
testEndpoint('/api/ai-chat', testChatData);
testEndpoint('/api/database', testData);
testEndpoint('/api/health', {}, 'GET');
testEndpoint('/api/test', {}, 'GET');