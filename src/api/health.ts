import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(request: VercelRequest, response: VercelResponse) {
  response.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'StatSor API',
    version: '1.0.0'
  });
}