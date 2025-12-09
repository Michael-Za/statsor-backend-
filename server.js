// Universal server entry point - Works for both Railway and Koyeb
import express from 'express';
import http from 'http';
import path from 'path';

console.log('🚀 Starting StatSor Backend...');
console.log('📁 Loading backend server...');

// Create a simple Express app first for health check
const app = express();

// Add health check endpoint immediately
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start the server immediately for health check
const port = process.env.PORT || 3001;
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`🚀 Health check server running on port ${port}`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  
  // Now load the full backend server
  console.log('📁 Loading full backend server...');
  try {
    // Change to backend directory
    process.chdir('./backend');
    
    // Load the full server
    import(path.resolve('./src/server.js')).then(() => {
      console.log('✅ Full backend server loaded successfully');
    }).catch((error) => {
      console.error('❌ Error loading backend server:', error.message);
      // Don't exit, keep health check running
    });
  } catch (error) {
    console.error('❌ Error changing directory or loading backend server:', error.message);
    // Don't exit, keep health check running
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});