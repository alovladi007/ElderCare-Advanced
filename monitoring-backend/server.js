const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:24610')
  .split(',')
  .map(origin => origin.trim());

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Import middleware
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const {
  sanitizeInput,
  detectSuspiciousActivity,
  hipaaSecurityHeaders,
  requestSizeLimiter
} = require('./middleware/security');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Security Middleware
app.use(helmet());
app.use(hipaaSecurityHeaders);
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestSizeLimiter('10mb'));

// Logging
app.use(morgan('dev'));

// Security: Input sanitization and suspicious activity detection
app.use(sanitizeInput);
app.use(detectSuspiciousActivity);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/vitals', require('./routes/vitals'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/devices', require('./routes/devices'));

// API Info
app.get('/', (req, res) => {
  res.json({
    name: 'ElderCare Advanced Monitoring API',
    version: '1.0.0',
    status: 'OK',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      vitals: '/api/vitals',
      alerts: '/api/alerts',
      analytics: '/api/analytics',
      devices: '/api/devices'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// WebSocket connection handling
const activeConnections = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      const User = require('./models/User');
      const user = await User.findById(decoded.id).populate('assignedPatients');

      if (user && user.isActive) {
        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.assignedPatients = user.assignedPatients.map(p => p._id.toString());

        activeConnections.set(socket.id, {
          userId: socket.userId,
          userRole: socket.userRole,
          assignedPatients: socket.assignedPatients
        });

        // Join rooms for assigned patients
        socket.assignedPatients.forEach(patientId => {
          socket.join(`patient-${patientId}`);
        });

        socket.emit('authenticated', {
          success: true,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });

        console.log(`User ${user.firstName} ${user.lastName} (${user.role}) authenticated`);
      } else {
        socket.emit('authenticated', { success: false, message: 'Invalid user' });
      }
    } catch (error) {
      socket.emit('authenticated', { success: false, message: 'Authentication failed' });
    }
  });

  // Subscribe to specific patient updates
  socket.on('subscribe-patient', (patientId) => {
    if (socket.assignedPatients && socket.assignedPatients.includes(patientId)) {
      socket.join(`patient-${patientId}`);
      console.log(`Socket ${socket.id} subscribed to patient ${patientId}`);
    }
  });

  // Unsubscribe from patient updates
  socket.on('unsubscribe-patient', (patientId) => {
    socket.leave(`patient-${patientId}`);
    console.log(`Socket ${socket.id} unsubscribed from patient ${patientId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    activeConnections.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in other files
global.io = io;

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 24613;

server.listen(PORT, () => {
  console.log(`Monitoring Server running on port ${PORT}`);
  console.log(`WebSocket server ready for real-time monitoring`);
});

module.exports = { app, io };
