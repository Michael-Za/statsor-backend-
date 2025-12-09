// Simple test script to verify AI route functionality
import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';

// Initialize Groq with the API key from environment variables
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY 
});

async function testAIConnection() {
    try {
        console.log('Testing AI connection...');
        
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Hello, are you working?' }],
            model: 'mixtral-8x7b-32768',
        });

        const response = completion.choices[0]?.message?.content || "No response";
        console.log('AI Response:', response);
        console.log('✅ AI connection successful!');
        return true;
    } catch (error) {
        console.error('❌ AI Connection Error:', error.message);
        return false;
    }
}

// Run the test
testAIConnection();