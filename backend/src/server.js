require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const blockchainRoutes = require('./routes/blockchain');
const graveyardRoutes = require('./routes/graveyard');
const graveRoutes = require('./routes/grave');
const ipfsRoutes = require('./routes/ipfs');
const publicRoutes = require('./routes/public');
const locationRoutes = require('./routes/location');

const app = express();
const PORT = process.env.PORT || 3001;

// ============ Middleware ============

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// ============ Routes ============

app.get('/', (req, res) => {
  res.json({
    message: 'Cemetery Blockchain API',
    version: '1.0.0',
    endpoints: {
      blockchain: '/api/blockchain',
      graveyards: '/api/graveyards',
      graves: '/api/graves',
      ipfs: '/api/ipfs',
      location: '/api/location',
      public: '/api/public (No auth required)'
    }
  });
});

app.use('/api/blockchain', blockchainRoutes);
app.use('/api/graveyards', graveyardRoutes);
app.use('/api/graves', graveRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/public', publicRoutes);

// ============ Error Handling ============

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`✅ Cemetery Backend API running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
