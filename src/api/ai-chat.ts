import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

// Import the AI services
let GroqService: any;
let AIChatHistoryService: any;

import('../../backend/src/services/groqService')
  .then(module => {
    GroqService = module.default || module;
  })
  .catch(err => {
    console.warn('Could not load GroqService:', err);
  });

import('../../backend/src/services/aiChatHistoryService')
  .then(module => {
    AIChatHistoryService = module.default || module;
  })
  .catch(err => {
    console.warn('Could not load AIChatHistoryService:', err);
  });

let groqService: any = null;
let aiChatHistoryService: any = null;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    // Initialize services if not already done
    if (!groqService && GroqService) {
      groqService = new GroqService();
    }
    
    if (!aiChatHistoryService && AIChatHistoryService) {
      aiChatHistoryService = new AIChatHistoryService();
    }

    const { action, ...data } = request.body;

    switch (request.method) {
      case 'POST':
        switch (action) {
          case 'sendMessage':
            if (!data.message || !data.userId) {
              return response.status(400).json({ error: 'Message and userId are required' });
            }
            
            if (!groqService || !aiChatHistoryService) {
              return response.status(500).json({ error: 'Services not initialized' });
            }
            
            try {
              // Save user message to history
              await aiChatHistoryService.saveMessage(data.userId, 'user', data.message);
              
              // Get AI response
              const aiResponse = await groqService.getAIResponse(data.message, data.context);
              
              // Save AI response to history
              await aiChatHistoryService.saveMessage(data.userId, 'assistant', aiResponse);
              
              return response.status(200).json({
                success: true,
                response: aiResponse
              });
            } catch (error) {
              return response.status(500).json({
                error: 'Failed to process AI chat message',
                message: error instanceof Error ? error.message : 'Unknown error'
              });
            }

          case 'getHistory':
            if (!data.userId) {
              return response.status(400).json({ error: 'UserId is required' });
            }
            
            if (!aiChatHistoryService) {
              return response.status(500).json({ error: 'Chat history service not initialized' });
            }
            
            try {
              const history = await aiChatHistoryService.getChatHistory(data.userId);
              return response.status(200).json(history);
            } catch (error) {
              return response.status(500).json({
                error: 'Failed to retrieve chat history',
                message: error instanceof Error ? error.message : 'Unknown error'
              });
            }

          default:
            return response.status(400).json({ error: 'Invalid action' });
        }

      case 'GET':
        // Check AI service status
        const status = {
          groqInitialized: !!groqService,
          hasApiKey: !!(process.env['GROQ_API_KEY'] && process.env['GROQ_API_KEY'] !== 'your_groq_api_key'),
          chatHistoryInitialized: !!aiChatHistoryService
        };
        return response.status(200).json({ status });

      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in AI chat API:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}