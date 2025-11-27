const axios = require('axios');

async function testAIAssistant() {
  try {
    console.log('Testing AI Assistant connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('Health check:', healthResponse.data);
    
    // Test chat endpoint
    const chatResponse = await axios.post('http://localhost:5000/api/chat', {
      message: 'Hello, what can you help me with?',
      context: {}
    });
    
    console.log('Chat response:', chatResponse.data);
    
    console.log('AI Assistant is working correctly!');
  } catch (error) {
    console.error('Error testing AI Assistant:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testAIAssistant();