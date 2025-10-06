const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Monitoring Server running on port ${PORT}`);
  console.log(`WebSocket server ready for real-time monitoring`);
});

module.exports = { app, io };
