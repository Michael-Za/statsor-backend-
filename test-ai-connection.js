const http = require('http');

async function testAIConnection() {
  console.log('Testing AI Assistant Connection...\n');
  
  // Test the main backend
  try {
    const backendReq = http.get('http://localhost:3001/health', (res) => {
      console.log(`✅ Backend API: ${res.statusCode === 200 ? 'Connected' : `Error ${res.statusCode}`}`);
    });
    
    backendReq.on('error', (err) => {
      console.log(`❌ Backend API: Connection failed - ${err.message}`);
    });
    
    backendReq.setTimeout(5000, () => {
      backendReq.destroy();
      console.log('❌ Backend API: Connection timeout');
    });
  } catch (error) {
    console.log(`❌ Backend API: ${error.message}`);
  }
  
  // Test the AI assistant backend
  try {
    const aiReq = http.get('http://localhost:5000/health', (res) => {
      console.log(`✅ AI Assistant Backend: ${res.statusCode === 200 ? 'Connected' : `Error ${res.statusCode}`}`);
    });
    
    aiReq.on('error', (err) => {
      console.log(`❌ AI Assistant Backend: Connection failed - ${err.message}`);
    });
    
    aiReq.setTimeout(5000, () => {
      aiReq.destroy();
      console.log('❌ AI Assistant Backend: Connection timeout');
    });
  } catch (error) {
    console.log(`❌ AI Assistant Backend: ${error.message}`);
  }
  
  // Test the frontend
  try {
    const frontendReq = http.get('http://localhost:3006', (res) => {
      console.log(`✅ Frontend: ${res.statusCode === 200 ? 'Connected' : `Error ${res.statusCode}`}`);
    });
    
    frontendReq.on('error', (err) => {
      console.log(`❌ Frontend: Connection failed - ${err.message}`);
    });
    
    frontendReq.setTimeout(5000, () => {
      frontendReq.destroy();
      console.log('❌ Frontend: Connection timeout');
    });
  } catch (error) {
    console.log(`❌ Frontend: ${error.message}`);
  }
  
  console.log('\n💡 Tips:');
  console.log('- If services are not running, start them with: docker-compose up -d');
  console.log('- If using manual installation, ensure all three services are started');
  console.log('- Check that ports 3001, 3006, and 5000 are not blocked by firewall');
}

testAIConnection();