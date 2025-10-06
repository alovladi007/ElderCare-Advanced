const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Import routes
const bookingRoutes = require('./routes/bookings');
const contactRoutes = require('./routes/contact');
const serviceRoutes = require('./routes/services');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✓ MongoDB Connected Successfully');
    } else {
      console.log('⚠ MongoDB URI not provided - running in demo mode');
    }
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    console.log('⚠ Continuing in demo mode without database');
  }
};

connectDB();

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'ElderCare & HomeCare API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ElderCare & HomeCare API',
    version: '1.0.0',
    endpoints: {
      bookings: '/api/bookings',
      contact: '/api/contact',
      services: '/api/services',
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║         ElderCare & HomeCare Services - Backend API             ║
║                        Version 1.0.0                             ║
╠══════════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║  API Documentation: http://localhost:${PORT}/api                    ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
