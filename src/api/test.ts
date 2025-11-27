import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    // Simple test endpoint
    response.status(200).json({
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url
    });
  } catch (error) {
    console.error('Error in test API:', error);
    response.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}