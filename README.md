# ElderCare Advanced - Complete Platform

> **Comprehensive elder care platform integrating smart home safety, real-time health monitoring, care management, and family coordination.**

## 🎯 Platform Overview

ElderCare Advanced is a fully integrated platform combining:

- **Smart Home & Safety Module** - IoT sensors, fall detection, emergency protocols
- **Real-time Health Monitoring** - Vitals tracking, alerts, WebSocket updates
- **Care Management** - Care plans, medications, appointments, tasks
- **Booking System** - Service scheduling and management
- **Family Portal** - Unified dashboard for family members
- **Admin & Caregiver Tools** - Complete oversight and coordination

## 🏗️ Architecture

### Backend Services

1. **NestJS Backend** (Port 3001) - **Primary API Server**
   - Unified authentication (JWT)
   - Smart home management
   - Elder profile API
   - Booking system
   - PostgreSQL + Prisma ORM

2. **Monitoring Backend** (Port 4000)
   - Real-time vital signs
   - WebSocket for live updates
   - Alert system
   - MongoDB

3. **Legacy Server** (Port 5000)
   - Service catalog
   - Contact forms
   - Employee management
   - MongoDB

### Frontend Applications

1. **React Client** (Port 3000)
   - Main website
   - Public pages
   - Booking interface
   - Employee dashboard

2. **Next.js Frontend** (Port 3002)
   - Smart home dashboard
   - Elder help screen
   - Simulator interface

### Databases

- **PostgreSQL** - Primary database (smart home, care plans, bookings)
- **MongoDB** - Health monitoring, legacy services

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (recommended)
- OR: Node.js 18+, PostgreSQL 15+, MongoDB 6+

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd ElderCare-Advanced

# Create environment file
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed

# Access the platform
# Main Website: http://localhost:3000
# Smart Home UI: http://localhost:3002
# API Docs: http://localhost:3001/api/docs
# Monitoring: http://localhost:4000
```

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL connection

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed database
npm run seed

# Start server
npm run dev
# Backend runs on http://localhost:3001
```

#### 2. Frontend Setup

```bash
# React Client
cd client
npm install
npm start
# Runs on http://localhost:3000

# Next.js Frontend (new terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:3002
```

#### 3. Monitoring Backend

```bash
cd monitoring-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with MongoDB connection

# Seed test data
npm run seed

# Start server
npm run dev
# Runs on http://localhost:4000
```

## 📚 Documentation

- **[Platform Analysis](./PLATFORM_ANALYSIS.md)** - Complete system analysis
- **[Smart Home Module](./SMART_HOME_README.md)** - Smart home documentation
- **[Monitoring System](./MONITORING_SYSTEM.md)** - Health monitoring guide
- **[Quick Start Guide](./QUICK_START_MONITORING.md)** - Monitoring quick start
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment

## 🔑 Demo Credentials

After seeding the database:

```
Admin:     admin@eldercare.com / admin123
Family:    family@eldercare.com / family123
Caregiver: caregiver@eldercare.com / caregiver123
Elder:     elder@eldercare.com / elder123
```

## 📋 Key Features

### ✅ Implemented

#### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Clinician, Caregiver, Family, Elder)
- Password reset flow
- Session management

#### Smart Home & Safety
- Multi-zone home monitoring
- Device, sensor, actuator management
- Real-time event processing
- Automation rules engine
- Emergency scenario protocols
- Fall detection
- Smoke/fire alerts
- Inactivity monitoring
- IoT gateway with authentication

#### Health Monitoring
- Real-time vital signs tracking
- WebSocket live updates
- Alert system with severity levels
- Historical data analysis
- Multi-patient monitoring

#### Care Management
- Comprehensive elder profiles
- Care plans with goals and tasks
- Medication tracking
- Appointment scheduling
- Task assignment

#### Booking System
- Service catalog
- Online booking
- Status management
- Email notifications (configurable)

#### Family Portal (Unified Dashboard)
- Complete elder overview
- Smart home status
- Health vitals
- Recent alerts
- Upcoming appointments
- Medication schedule
- Care tasks

### 🎯 API Endpoints

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset password

**Elder Profile**
- `GET /api/elder-profile` - List all elders
- `GET /api/elder-profile/:id` - Get unified profile
- `GET /api/elder-profile/:id/dashboard` - Dashboard data
- `GET /api/elder-profile/:id/health` - Health overview
- `POST /api/elder-profile` - Create profile
- `PATCH /api/elder-profile/:id` - Update profile

**Smart Home**
- `GET /api/homes/elder/:elderId` - Get home
- `GET /api/homes/:id/status` - Home status
- `POST /api/homes/:homeId/zones` - Create zone
- `GET /api/devices/home/:homeId` - Get devices
- `POST /api/iot/events` - Ingest sensor events
- `GET /api/automation/rules/home/:homeId` - Get rules
- `GET /api/emergency/scenarios/home/:homeId` - Get scenarios

**Bookings**
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking
- `PATCH /api/bookings/:id` - Update booking
- `GET /api/bookings/stats` - Statistics

**Simulator**
- `POST /api/sim/smart-home/fall/:homeId` - Simulate fall
- `POST /api/sim/smart-home/smoke/:homeId` - Simulate smoke
- `POST /api/sim/smart-home/gas-leak/:homeId` - Simulate gas leak

Full API documentation: http://localhost:3001/api/docs

## 🧪 Testing

### Smart Home Simulator

1. Access simulator: http://localhost:3002/admin/simulator
2. Copy Home ID from seed output
3. Test scenarios:
   - Fall detection
   - Smoke/fire alarm
   - Gas leak
   - Water leak
   - Motion patterns

### Health Monitoring

1. Login at: http://localhost:3000/monitoring/login
2. Use demo credentials
3. View real-time vitals
4. Create test alerts

### Unified Dashboard

1. Login at: http://localhost:3000
2. Navigate to Elder Care section
3. View integrated dashboard
4. See all data in one place

## 🐳 Docker Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View service status
docker-compose ps

# Access database
docker-compose exec postgres psql -U eldercare -d eldercare_db
docker-compose exec mongodb mongosh -u eldercare -p eldercare_password
```

## 📊 Database Schema

### Key Models

- **User** - Authentication and basic info
- **ElderProfile** - Complete elder information
- **Home** - Smart home configuration
- **Device, Sensor, Actuator** - IoT devices
- **SensorEvent** - All sensor readings
- **AutomationRule** - Automation logic
- **EmergencyScenario** - Emergency protocols
- **Alert** - All alert types
- **VitalReading** - Health measurements
- **Medication** - Medication tracking
- **Appointment** - Calendar events
- **CarePlan** - Care planning
- **Booking** - Service bookings

## 🔧 Development

### Backend Development

```bash
cd backend

# Run in development mode
npm run dev

# Generate Prisma client after schema changes
npm run prisma:generate

# Create migration
npm run prisma:migrate

# View database
npm run prisma:studio

# Run tests
npm test
```

### Frontend Development

```bash
# React Client
cd client
npm start

# Next.js Frontend
cd frontend
npm run dev
```

## 🌐 Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://eldercare:eldercare_password@localhost:5432/eldercare_db
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
IOT_TOKEN_SECRET=your-iot-secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Client (.env)

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_MONITORING_URL=http://localhost:4000
```

## 📈 Performance

- API response time: <200ms
- WebSocket latency: <50ms
- Alert delivery: <5 seconds
- Database queries: Optimized with indexes
- Frontend: Code splitting, lazy loading

## 🔒 Security

- JWT authentication
- Password hashing (bcrypt)
- Role-based access control
- SQL injection prevention (Prisma)
- XSS protection
- CORS configuration
- Rate limiting (configurable)
- IoT device authentication

## 🚢 Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for:
- Cloud deployment (AWS, Azure, GCP)
- SSL/TLS configuration
- Database backups
- Monitoring & logging
- Scaling strategies
- CI/CD pipeline

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Use conventional commits
5. Test thoroughly before submitting

## 📄 License

MIT License - See LICENSE file

## 🆘 Support

- Issues: GitHub Issues
- Documentation: See /docs
- API Docs: http://localhost:3001/api/docs

---

**Built with**: Node.js • NestJS • Next.js • React • PostgreSQL • MongoDB • Prisma • Socket.io • Tailwind CSS • TypeScript
