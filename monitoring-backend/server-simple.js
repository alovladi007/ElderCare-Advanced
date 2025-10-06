const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3002', 'http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple file-based database
const DB_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    users: [
      {
        _id: 'user1',
        email: 'doctor@evergreen.com',
        password: bcrypt.hashSync('password123', 10),
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        role: 'doctor',
        assignedPatients: ['patient1', 'patient2']
      },
      {
        _id: 'user2',
        email: 'nurse@evergreen.com',
        password: bcrypt.hashSync('password123', 10),
        firstName: 'Emily',
        lastName: 'Chen',
        role: 'nurse',
        assignedPatients: ['patient1', 'patient2']
      },
      {
        _id: 'user3',
        email: 'john.doe@email.com',
        password: bcrypt.hashSync('password123', 10),
        firstName: 'John',
        lastName: 'Doe',
        role: 'family',
        assignedPatients: ['patient1']
      }
    ],
    patients: [
      {
        _id: 'patient1',
        firstName: 'Margaret',
        lastName: 'Smith',
        dateOfBirth: '1945-03-15',
        medicalRecordNumber: 'MRN001234',
        address: {
          street: '123 Oak Street',
          city: 'Portland',
          state: 'OR',
          zipCode: '97201'
        },
        emergencyContacts: [
          {
            name: 'John Doe',
            relationship: 'Son',
            phone: '(555) 123-4567',
            email: 'john.doe@email.com'
          }
        ],
        conditions: ['Hypertension', 'Type 2 Diabetes', 'Mild Dementia'],
        medications: [
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }
        ]
      },
      {
        _id: 'patient2',
        firstName: 'Robert',
        lastName: 'Williams',
        dateOfBirth: '1938-07-22',
        medicalRecordNumber: 'MRN001235',
        address: {
          street: '456 Maple Avenue',
          city: 'Portland',
          state: 'OR',
          zipCode: '97202'
        },
        emergencyContacts: [
          {
            name: 'Lisa Williams',
            relationship: 'Daughter',
            phone: '(555) 987-6543',
            email: 'lisa.w@email.com'
          }
        ],
        conditions: ['Atrial Fibrillation', 'Osteoarthritis'],
        medications: [
          { name: 'Warfarin', dosage: '5mg', frequency: 'Once daily' },
          { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed' }
        ]
      }
    ],
    vitals: [],
    alerts: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Helper functions
const readData = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeData = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Generate sample vital readings with extended metrics
const generateVitals = (patientId) => {
  const now = new Date();
  const systolic = 120 + Math.floor(Math.random() * 30);
  const diastolic = 70 + Math.floor(Math.random() * 20);
  const heartRate = 65 + Math.floor(Math.random() * 25);

  return {
    _id: `vital-${Date.now()}-${Math.random()}`,
    patient: patientId,
    timestamp: now.toISOString(),

    // Cardiovascular metrics
    bloodPressure: {
      systolic: systolic,
      diastolic: diastolic,
      map: Math.round((systolic + 2 * diastolic) / 3) // Mean Arterial Pressure
    },
    heartRate: heartRate,
    heartRateVariability: 40 + Math.floor(Math.random() * 40), // HRV in ms
    cardiacOutput: (4.5 + Math.random() * 2).toFixed(1), // L/min

    // Respiratory metrics
    respiratoryRate: 14 + Math.floor(Math.random() * 6),
    oxygenSaturation: 95 + Math.floor(Math.random() * 5),
    endTidalCO2: 35 + Math.floor(Math.random() * 8), // mmHg
    peakExpiratoryFlow: 300 + Math.floor(Math.random() * 100), // L/min

    // Metabolic metrics
    temperature: (97 + Math.random() * 2).toFixed(1),
    bloodGlucose: 90 + Math.floor(Math.random() * 50),
    bloodLactate: (0.5 + Math.random() * 1.5).toFixed(1), // mmol/L

    // Neurological metrics
    consciousnessLevel: Math.random() > 0.95 ? 'Drowsy' : 'Alert',
    painLevel: Math.floor(Math.random() * 3), // 0-10 scale (mostly low)
    pupilResponse: Math.random() > 0.98 ? 'Sluggish' : 'Normal',

    // Activity metrics
    steps: Math.floor(Math.random() * 50), // Steps in last hour
    movementDetected: Math.random() > 0.3,
    positionChanges: Math.floor(Math.random() * 5),
    fallRisk: Math.random() > 0.9 ? 'High' : Math.random() > 0.7 ? 'Medium' : 'Low',

    // Sleep metrics (if nighttime)
    sleepQuality: ['Deep', 'Light', 'REM', 'Awake'][Math.floor(Math.random() * 4)],
    sleepDuration: Math.floor(Math.random() * 480), // minutes

    // Hydration & nutrition
    fluidIntake: Math.floor(Math.random() * 200), // mL in last hour
    nutritionScore: 70 + Math.floor(Math.random() * 30), // %

    // Environmental
    roomTemperature: (68 + Math.random() * 6).toFixed(1),
    roomHumidity: 40 + Math.floor(Math.random() * 20),

    // Device status
    deviceBattery: 85 + Math.floor(Math.random() * 15),
    signalStrength: 3 + Math.floor(Math.random() * 2), // bars out of 5
    lastSync: now.toISOString()
  };
};

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = readData();
    const user = data.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, 'your-secret-key', { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          assignedPatients: user.assignedPatients
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/patients', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, 'your-secret-key');
    const data = readData();
    const user = data.users.find(u => u._id === decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const patients = data.patients.filter(p => user.assignedPatients.includes(p._id));
    res.json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/vitals/:patientId/latest', (req, res) => {
  try {
    const { patientId } = req.params;
    const data = readData();

    // Generate fresh vitals
    const vitals = generateVitals(patientId);

    res.json({ success: true, data: vitals });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/vitals/:patientId', (req, res) => {
  try {
    const { patientId } = req.params;
    const { hours = 24 } = req.query;

    // Generate 20 sample readings
    const readings = [];
    for (let i = 0; i < 20; i++) {
      readings.push(generateVitals(patientId));
    }

    res.json({ success: true, data: readings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/alerts', (req, res) => {
  try {
    const data = readData();
    res.json({
      success: true,
      data: [
        {
          _id: 'alert1',
          patient: 'patient1',
          type: 'vital-abnormal',
          severity: 'medium',
          message: 'Blood pressure elevated: 145/92',
          timestamp: new Date().toISOString(),
          status: 'active'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/alerts/:id', (req, res) => {
  try {
    res.json({ success: true, message: 'Alert updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket handling
const activeConnections = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, 'your-secret-key');
      const data = readData();
      const user = data.users.find(u => u._id === decoded.id);

      if (user) {
        socket.userId = user._id;
        socket.userRole = user.role;
        socket.assignedPatients = user.assignedPatients;

        activeConnections.set(socket.id, {
          userId: socket.userId,
          userRole: socket.userRole,
          assignedPatients: socket.assignedPatients
        });

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
      }
    } catch (error) {
      socket.emit('authenticated', { success: false, message: 'Authentication failed' });
    }
  });

  socket.on('disconnect', () => {
    activeConnections.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

// Simulate real-time vital readings every 10 seconds
setInterval(() => {
  const data = readData();
  data.patients.forEach(patient => {
    const vitals = generateVitals(patient._id);
    io.to(`patient-${patient._id}`).emit('vital-reading', {
      patientId: patient._id,
      reading: vitals
    });
  });
}, 10000);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`\n✅ Monitoring Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready for real-time monitoring`);
  console.log(`\n📊 Access the dashboard at: http://localhost:3002/#/monitoring/login`);
  console.log(`\n👤 Test Login Credentials:`);
  console.log(`   Doctor: doctor@evergreen.com / password123`);
  console.log(`   Nurse: nurse@evergreen.com / password123`);
  console.log(`   Family: john.doe@email.com / password123\n`);
});
