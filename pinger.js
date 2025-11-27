const https = require('https');
const http = require('http');

const SANDBOX_URL = 'https://gw6624-2222.csb.app/api/v1/health';
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes (under 5 min timeout)

function pingSandbox() {
  const protocol = SANDBOX_URL.startsWith('https') ? https : http;
  
  protocol.get(SANDBOX_URL, (res) => {
    console.log(`✅ Sandbox pinged successfully at ${new Date().toISOString()}`);
    console.log(`Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.log(`❌ Sandbox ping failed at ${new Date().toISOString()}:`, err.message);
  });
}

console.log('🚀 Starting CodeSandbox pinger...');
pingSandbox(); // Ping immediately
setInterval(pingSandbox, PING_INTERVAL);

console.log(`⏰ Pinging ${SANDBOX_URL} every 4 minutes to prevent sleep`);
