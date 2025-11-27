const express = require('express');
const path = require('path');
const app = express();
const port = 3006;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});