#!/usr/bin/env node

// ES Module entry point for the server
import('./src/server.js').then(() => {
  console.log('Server started successfully');
}).catch((error) => {
  console.error('Error starting server:', error);
});