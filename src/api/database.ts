import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

// Import the database service
let DatabaseService: any;

import('../../backend/src/services/database')
  .then(module => {
    DatabaseService = module.default || module;
  })
  .catch(err => {
    console.warn('Could not load DatabaseService:', err);
  });

let databaseService: any = null;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    // Initialize database service if not already done
    if (!databaseService && DatabaseService) {
      databaseService = new DatabaseService();
      try {
        await databaseService.initialize();
      } catch (initError: any) {
        console.warn('Database initialization warning:', initError.message);
      }
    }

    const { action, table, ...data } = request.body;

    switch (request.method) {
      case 'GET':
        // Health check
        if (request.query['health'] === 'true') {
          const status = {
            initialized: !!databaseService,
            connected: databaseService?.isConnected || false,
            mockMode: databaseService?.mockMode || false
          };
          return response.status(200).json({ status });
        }
        
        // Get data from a table
        if (table) {
          if (!databaseService) {
            return response.status(500).json({ error: 'Database service not initialized' });
          }
          
          try {
            let query = databaseService.supabase.from(table);
            
            // Apply filters if provided
            if (data.filters) {
              Object.keys(data.filters).forEach(key => {
                query = query.eq(key, data.filters[key]);
              });
            }
            
            // Apply limit if provided
            if (data.limit) {
              query = query.limit(data.limit);
            }
            
            const { data: result, error } = await query.select(data.select || '*');
            
            if (error) {
              return response.status(400).json({ error: error.message });
            }
            
            return response.status(200).json(result);
          } catch (error: any) {
            return response.status(500).json({ error: error.message });
          }
        }
        
        return response.status(400).json({ error: 'Table name is required' });

      case 'POST':
        // Insert data into a table
        if (!databaseService) {
          return response.status(500).json({ error: 'Database service not initialized' });
        }
        
        if (table && data.record) {
          try {
            const { data: result, error } = await databaseService.supabase
              .from(table)
              .insert(data.record)
              .select();
            
            if (error) {
              return response.status(400).json({ error: error.message });
            }
            
            return response.status(201).json(result);
          } catch (error: any) {
            return response.status(500).json({ error: error.message });
          }
        }
        
        return response.status(400).json({ error: 'Table name and record data are required' });

      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in database API:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}