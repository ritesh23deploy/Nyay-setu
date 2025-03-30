
const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Simple routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Get all items
app.get('/api/items', (req, res) => {
  res.json([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]);
});

// Get item by ID
app.get('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  res.json({ id, name: `Item ${id}` });
});

// Create new item
app.post('/api/items', (req, res) => {
  const { name } = req.body;
  res.status(201).json({ id: 3, name });
});

// Update item
app.put('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;
  res.json({ id, name });
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  res.json({ message: `Item ${id} deleted` });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
