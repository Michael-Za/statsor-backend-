const http = require('http');

// Test the email endpoint
const postData = JSON.stringify({
  action: 'sendWelcome',
  user: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'statsor1@gmail.com'
  }
});

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

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Response: ${data}`);
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.write(postData);
req.end();