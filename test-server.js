const express = require('express');
const path = require('path');
const app = express();
const port = 3006;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the main index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});