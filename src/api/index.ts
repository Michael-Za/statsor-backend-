import { VercelRequest, VercelResponse } from '@vercel/node';
import * as express from 'express';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

// Create an Express app instance
const app = express();

// Export the Vercel handler
export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    // Simple response for the root API endpoint
    response.status(200).json({
      message: 'StatSor API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error: any) {
    console.error('Error in Vercel handler:', error);
    response.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}