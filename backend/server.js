const express = require('express');
const cors = require('cors');
const stockRoutes = require('./routes/stocks');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', stockRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Stock Volatility Analysis API',
    version: '1.0.0',
    endpoints: {
      stock: 'GET /api/stock/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD&method=garch',
      volatility: 'POST /api/volatility',
      search: 'GET /api/search/:query',
      quote: 'GET /api/quote/:symbol',
      health: 'GET /health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Stock Volatility API Server running on port ${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;

