# ElderCare Advanced Platform 🏥

A comprehensive, full-stack software platform designed to support elderly individuals during retirement, featuring real-time health monitoring, smart home integration, care services booking, and more.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-61dafb)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Platform](#-running-the-platform)
- [API Documentation](#-api-documentation)
- [Security Features](#-security-features)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🏥 Health Monitoring System
- **Real-time Vital Signs Tracking**: Blood pressure, glucose, heart rate, temperature, SpO2, ECG
- **35+ Live Health Indicators**: Comprehensive monitoring with customizable thresholds
- **WebSocket Integration**: Instant updates and alerts
- **Smart Alert System**: 8 alert types with 4 severity levels
- **Role-Based Access Control**: Doctor, Nurse, Family, Caregiver, Admin roles
- **Multi-Channel Notifications**: Email, SMS, Push (with quiet hours support)
- **Predictive Analytics**: AI-powered health issue prediction
- **Comprehensive Reports**: Automated health reports with trends and recommendations

### 🏠 Smart Home Integration
- **Device Management**: Register and monitor multiple device types
- **Fall Detection**: Camera-based fall detection with instant alerts
- **Motion Tracking**: Room-by-room activity monitoring
- **Inactivity Alerts**: Automated detection of prolonged inactivity
- **Wandering Prevention**: Door sensors with nighttime monitoring
- **Emergency Button**: One-touch emergency alerts
- **Device Status Monitoring**: Real-time device health tracking

### 📅 Care Services & Booking
- **11 Service Categories**:
  - 24/7 Personal Care
  - Memory Care
  - Medication Management
  - Home Repairs & Maintenance
  - Companionship
  - Meal Preparation
  - Safety Modifications
  - And more...
- **Online Booking System**: Easy scheduling with status tracking
- **Employee Time Tracking**: Clock in/out with work history

### 📊 Analytics & Reporting
- **Vital Statistics**: Min, max, average, median, standard deviation
- **Alert Trends**: Daily patterns, peak hours, severity distribution
- **Health Score Calculation**: Automated scoring based on vitals and alerts
- **Risk Assessment**: Identify and track risk factors
- **Data Export**: JSON and CSV export capabilities
- **System-Wide Dashboard**: Admin analytics and insights

### 🔒 Security & Compliance
- **HIPAA-Compliant Security Headers**
- **Rate Limiting**: Protection against DDoS and abuse
- **Audit Logging**: Complete activity tracking for 2 years
- **Input Sanitization**: XSS and SQL injection prevention
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Automatic timeout and security checks

## 🏗 Architecture

```
ElderCare-Advanced/
├── client/                      # React Frontend (SPA)
│   ├── src/
│   │   ├── pages/              # 36 page components
│   │   ├── components/         # Reusable UI components
│   │   └── App.js              # Main app with routing
│   └── public/                 # Static assets & PWA files
│
├── server/                      # Main Backend (Business Services)
│   ├── routes/                 # API route handlers
│   ├── models/                 # Database models
│   └── server.js               # Express server
│
├── monitoring-backend/          # Health Monitoring System
│   ├── routes/                 # Monitoring API routes
│   │   ├── auth.js            # Authentication
│   │   ├── patients.js        # Patient management
│   │   ├── vitals.js          # Vital signs
│   │   ├── alerts.js          # Alert management
│   │   ├── analytics.js       # Analytics & reporting (NEW)
│   │   └── devices.js         # Device integration (NEW)
│   ├── models/                 # Database schemas
│   │   ├── User.js            # User accounts
│   │   ├── Patient.js         # Patient records
│   │   ├── VitalReading.js    # Vital signs data
│   │   ├── Alert.js           # Alert records
│   │   └── AuditLog.js        # Security audit logs (NEW)
│   ├── services/               # Business logic services (NEW)
│   │   ├── notificationService.js  # Email/SMS/Push notifications
│   │   ├── analyticsService.js     # Data analytics & reporting
│   │   └── deviceService.js        # Device integration layer
│   ├── middleware/             # Express middleware (NEW)
│   │   ├── auth.js            # Authentication & authorization
│   │   ├── rateLimiter.js     # Rate limiting protection
│   │   ├── security.js        # Security middleware
│   │   └── errorHandler.js    # Error handling
│   ├── config/                 # Configuration files
│   └── server.js               # Main server with WebSocket
│
└── docs/                        # Documentation
    ├── MONITORING_SYSTEM.md
    ├── DEPLOYMENT_GUIDE.md
    └── QUICK_START.html
```

## 🛠 Technology Stack

### Frontend
- **React 18.2** - UI library
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Socket.io-client** - Real-time WebSocket
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js + Express.js** - Server framework
- **MongoDB + Mongoose** - Database
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Nodemailer** - Email notifications
- **Twilio** - SMS notifications

### Security & Middleware
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Compression** - Response compression
- **Morgan** - Request logging
- **Express Validator** - Input validation

### DevOps
- **Nodemon** - Development auto-reload
- **PWA** - Progressive Web App support
- **GitHub Pages** - Frontend deployment
- **Vercel** - Full-stack deployment ready

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 16.0.0
- **MongoDB** >= 5.0
- **npm** or **yarn**
- (Optional) **Redis** for distributed rate limiting

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/alovladi007/ElderCare-Advanced.git
   cd ElderCare-Advanced
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install monitoring backend dependencies
   cd ../monitoring-backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In monitoring-backend directory
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB locally
   mongod

   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

5. **Run the platform**
   ```bash
   # Terminal 1 - Start monitoring backend
   cd monitoring-backend
   npm run dev

   # Terminal 2 - Start main backend (optional)
   cd server
   npm start

   # Terminal 3 - Start frontend
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Monitoring API: http://localhost:5001
   - Main API: http://localhost:5000

## ⚙ Configuration

### Environment Variables

Create a `.env` file in `monitoring-backend/` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/evergreen-monitoring

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Client URL
CLIENT_URL=http://localhost:3000

# Email Configuration (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Redis for distributed rate limiting
REDIS_URL=redis://localhost:6379

# Optional: Emergency Services API
EMERGENCY_API_KEY=your-emergency-api-key
```

### Security Configuration

**IMPORTANT**: Before deploying to production:

1. ✅ Change `JWT_SECRET` to a strong random string
2. ✅ Configure email credentials for notifications
3. ✅ Set up Twilio for SMS alerts
4. ✅ Review rate limiting settings in `middleware/rateLimiter.js`
5. ✅ Configure CORS origins in `server.js`
6. ✅ Set `NODE_ENV=production`

## 🎯 Running the Platform

### Development Mode

```bash
# Start all services
npm run dev
```

### Production Mode

```bash
# Build frontend
cd client
npm run build

# Start backend
cd ../monitoring-backend
NODE_ENV=production npm start
```

## 📚 API Documentation

### Base URLs

- **Monitoring API**: `http://localhost:5001/api`
- **Main API**: `http://localhost:5000/api`

### Authentication

All protected endpoints require a JWT token:

```bash
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
```http
POST   /api/auth/register       # Register new user
POST   /api/auth/login          # Login user
GET    /api/auth/me             # Get current user
PUT    /api/auth/profile        # Update profile
PUT    /api/auth/password       # Change password
```

#### Patients
```http
GET    /api/patients            # List patients
GET    /api/patients/:id        # Get patient details
POST   /api/patients            # Create patient
PUT    /api/patients/:id        # Update patient
PUT    /api/patients/:id/monitoring-settings  # Update monitoring config
```

#### Vital Signs
```http
GET    /api/vitals/patient/:id               # Get patient vitals
GET    /api/vitals/patient/:id/latest        # Get latest readings
POST   /api/vitals                            # Submit vital reading
POST   /api/vitals/bulk                       # Bulk import readings
```

#### Alerts
```http
GET    /api/alerts              # List alerts
GET    /api/alerts/:id          # Get alert details
POST   /api/alerts              # Create alert
PUT    /api/alerts/:id/acknowledge  # Acknowledge alert
PUT    /api/alerts/:id/resolve      # Resolve alert
```

#### Analytics (NEW)
```http
GET    /api/analytics/patient/:id/vitals/:type/statistics  # Vital statistics
GET    /api/analytics/patient/:id/health-report            # Health report
GET    /api/analytics/patient/:id/alert-trends             # Alert trends
GET    /api/analytics/patient/:id/predictions              # Health predictions
GET    /api/analytics/patient/:id/export                   # Export data
GET    /api/analytics/system/overview                      # System analytics
```

#### Devices (NEW)
```http
GET    /api/devices/supported                 # Get supported devices
GET    /api/devices/info/:deviceType          # Get device info
POST   /api/devices/register                  # Register device
PATCH  /api/devices/:deviceId/status          # Update device status
POST   /api/devices/data                      # Submit device data
GET    /api/devices/patient/:patientId        # Get patient devices
POST   /api/devices/mock/:deviceType          # Generate mock data
```

### WebSocket Events

#### Client → Server
- `authenticate` - Authenticate socket connection
- `subscribe-patient` - Subscribe to patient updates
- `unsubscribe-patient` - Unsubscribe from patient

#### Server → Client
- `authenticated` - Authentication result
- `vital-reading` - New vital reading
- `new-alert` - New alert triggered
- `alert-acknowledged` - Alert acknowledged
- `alert-resolved` - Alert resolved
- `monitoring-settings-updated` - Settings changed

### Test Accounts

```javascript
// Doctor Account
{
  email: "doctor@eldercare.com",
  password: "doctor123",
  role: "doctor"
}

// Nurse Account
{
  email: "nurse@eldercare.com",
  password: "nurse123",
  role: "nurse"
}

// Family Member Account
{
  email: "family@eldercare.com",
  password: "family123",
  role: "family"
}
```

## 🔒 Security Features

### Implemented Security Measures

1. **Rate Limiting**
   - API: 100 requests / 15 min
   - Auth: 5 attempts / 15 min
   - Critical ops: 3 attempts / hour

2. **HIPAA-Compliant Headers**
   - Strict-Transport-Security
   - Content-Security-Policy
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff

3. **Input Sanitization**
   - XSS prevention
   - SQL injection protection
   - NoSQL injection detection
   - Path traversal blocking

4. **Audit Logging**
   - All sensitive operations logged
   - 2-year retention (HIPAA compliance)
   - User attribution tracking
   - IP address logging

5. **Authentication & Authorization**
   - JWT with configurable expiration
   - Role-based permissions
   - Patient-level access control
   - Session timeout management

### Security Best Practices

```javascript
// ✅ DO: Use environment variables
process.env.JWT_SECRET

// ❌ DON'T: Hardcode secrets
const secret = "my-secret-key"

// ✅ DO: Validate all inputs
const { body, validationResult } = require('express-validator');

// ✅ DO: Use HTTPS in production
// ✅ DO: Keep dependencies updated
npm audit fix

// ✅ DO: Review audit logs regularly
GET /api/analytics/audit-logs
```

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

### GitHub Pages (Frontend Only)

```bash
cd client
npm run deploy
```

### Docker

```bash
# Build image
docker build -t eldercare-advanced .

# Run container
docker run -p 5001:5001 --env-file .env eldercare-advanced
```

### Traditional Hosting (VPS/Cloud)

1. **Set up MongoDB** (Atlas recommended)
2. **Configure environment variables**
3. **Build frontend**: `cd client && npm run build`
4. **Start backend**: `cd monitoring-backend && npm start`
5. **Configure reverse proxy** (Nginx/Apache)
6. **Set up SSL** (Let's Encrypt)

### Environment-Specific Configuration

**Development**
- Debug logging enabled
- CORS: `http://localhost:3000`
- Hot reload enabled

**Production**
- `NODE_ENV=production`
- Compressed responses
- Security headers enforced
- Error details hidden

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Generate mock device data
POST /api/devices/mock/blood-pressure
{
  "patientId": "your-patient-id"
}

# Test notifications
# Configure email/SMS in .env and submit vital reading
POST /api/vitals
```

## 📝 Documentation

- [Monitoring System Guide](./MONITORING_SYSTEM.md)
- [Quick Start Guide](./QUICK_START.html)
- [Monitoring Access Guide](./MONITORING_ACCESS_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [API Reference](./monitoring-backend/README.md)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check the `/docs` folder
- **Issues**: Open an issue on GitHub
- **Email**: support@eldercare.com (example)

## 🎖 Credits

Developed by the ElderCare Advanced Team

Built with ❤️ for better elderly care

---

**Note**: This is a production-ready platform with comprehensive features. Ensure all security measures are properly configured before deploying to production.
