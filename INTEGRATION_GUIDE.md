# ElderCare Advanced - Integration Guide

## Overview

This guide covers the complete platform integration that unifies the ElderCare Advanced system, including:
- Unified authentication across all frontends
- API Gateway for seamless service communication
- Shared components and utilities
- Comprehensive testing suite

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
├──────────────────────┬──────────────────────────────────────┤
│  React Client (3000) │  Next.js Frontend (3002)            │
│  - Main Website      │  - Smart Home Dashboard             │
│  - Booking System    │  - Elder/Family Portals             │
│  - Health Monitor    │  - Admin Simulator                  │
└──────────┬───────────┴──────────────┬───────────────────────┘
           │                          │
           │      Unified Auth        │
           └──────────┬───────────────┘
                      │
           ┌──────────▼──────────┐
           │   NestJS Backend    │
           │   (Port 3001)       │
           │                     │
           │  ┌──────────────┐  │
           │  │  Auth Module │  │
           │  ├──────────────┤  │
           │  │ API Gateway  │──┼──┐
           │  ├──────────────┤  │  │
           │  │ Elder Profile│  │  │
           │  ├──────────────┤  │  │
           │  │ Smart Home   │  │  │
           │  ├──────────────┤  │  │
           │  │  Bookings    │  │  │
           │  └──────────────┘  │  │
           └─────────┬───────────┘  │
                     │              │
         ┌───────────┼──────────────┼───────────┐
         │           │              │           │
    ┌────▼────┐ ┌───▼──────┐  ┌───▼──────────┐│
    │PostgreSQL│ │  Legacy  │  │  Monitoring  ││
    │  (5432) │ │  Server  │  │   Backend    ││
    │         │ │  (5000)  │  │   (4000)     ││
    └─────────┘ └────┬─────┘  └───────┬──────┘│
                     │                 │       │
                ┌────▼─────────────────▼─┐     │
                │      MongoDB (27017)   │     │
                └────────────────────────┘     │
                                               │
                                          WebSocket
```

## Quick Start

### 1. Start All Services with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
curl http://localhost:3001/gateway/health
```

### 2. Access the Applications

- **React Client**: http://localhost:3000
- **Next.js Frontend**: http://localhost:3002
- **NestJS Backend API**: http://localhost:3001
- **Legacy Server**: http://localhost:5000
- **Monitoring Backend**: http://localhost:4000

### 3. Login with Demo Accounts

| Role       | Email                    | Password   |
|------------|--------------------------|------------|
| Admin      | admin@eldercare.com      | admin123   |
| Clinician  | dr.smith@eldercare.com   | doctor123  |
| Caregiver  | caregiver@eldercare.com  | care123    |
| Family     | family@example.com       | family123  |

## Unified Authentication

### Features

✅ **Single Sign-On (SSO)**: One login for all applications
✅ **JWT-based**: Secure token authentication
✅ **Role-Based Access Control**: Admin, Clinician, Caregiver, Family, Elder
✅ **Password Management**: Change password, forgot password flows
✅ **Session Persistence**: LocalStorage-based token storage

### API Endpoints

```
POST   /auth/register         - Create new user
POST   /auth/login           - Login user
GET    /auth/profile         - Get current user profile
POST   /auth/change-password - Change password
POST   /auth/forgot-password - Request password reset
POST   /auth/reset-password  - Reset password with token
```

### Usage in React

```typescript
import { useAuth } from '../../../shared/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email, password });
      // Redirected to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (!isAuthenticated) return <LoginPage />;

  return <div>Welcome {user.firstName}!</div>;
}
```

### Usage in Next.js

```typescript
import { login, getStoredUser } from '@/lib/auth';

export default function LoginPage() {
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  // ...
}
```

## API Gateway

The API Gateway provides a unified entry point for all backend services.

### Routes

```
GET    /gateway/health           - Health check for all services
GET    /gateway/routes           - List available routes
ALL    /gateway/legacy/*         - Proxy to legacy server
ALL    /gateway/monitoring/*     - Proxy to monitoring backend
```

### Example Usage

```typescript
import { apiClient } from '@/shared/api/api.client';

// Through API Gateway
const response = await apiClient.get('/gateway/legacy/api/bookings');

// Direct to NestJS
const profile = await elderProfileApi.getUnifiedProfile(elderId);
```

### Configuration

Environment variables in `docker-compose.yml`:

```yaml
environment:
  LEGACY_SERVER_URL: http://legacy-server:5000
  MONITORING_SERVER_URL: http://monitoring-backend:4000
```

## Unified Dashboard

The unified dashboard aggregates data from all systems:

- **Smart Home Status**: Device states, alerts, automation rules
- **Health Monitoring**: Latest vitals, medication adherence
- **Care Management**: Tasks, appointments, care plans
- **Alerts**: Real-time notifications from all systems

### API Endpoint

```
GET /elder-profile/:id/dashboard
```

### Response Structure

```json
{
  "summary": {
    "activeAlerts": 3,
    "pendingTasks": 5,
    "activeMedications": 4,
    "upcomingAppointments": 2
  },
  "alerts": [...],
  "medications": [...],
  "appointments": [...],
  "tasks": [...],
  "vitals": {...},
  "smartHome": {...}
}
```

## Shared Components

### UnifiedNav

Navigation component that works across React and Next.js:

```typescript
import { UnifiedNav } from '@/shared/components/UnifiedNav';

// In React
<UnifiedNav router="react" />

// In Next.js
<UnifiedNav router="nextjs" />
```

### QuickAccessMenu

Quick links to all platform services:

```typescript
import { QuickAccessMenu } from '@/shared/components/UnifiedNav';

<QuickAccessMenu onNavigate={handleNavigate} />
```

## API Client

The shared API client provides typed methods for all endpoints:

```typescript
import {
  elderProfileApi,
  bookingsApi,
  smartHomeApi,
  healthMonitoringApi,
  careManagementApi
} from '@/shared/api/api.client';

// Elder Profile
const dashboard = await elderProfileApi.getDashboard(elderId);
const health = await elderProfileApi.getHealthOverview(elderId);

// Bookings
const bookings = await bookingsApi.getAll({ status: 'PENDING' });
await bookingsApi.create({ elderProfileId, serviceId, ... });

// Smart Home
const devices = await smartHomeApi.getDevices(homeId);
await smartHomeApi.controlDevice(homeId, deviceId, { action: 'TURN_ON' });

// Health
const vitals = await healthMonitoringApi.getVitals(elderId);
await healthMonitoringApi.addVitalReading(elderId, { heartRate: 75, ... });

// Care Management
const medications = await careManagementApi.getMedications(elderId);
await careManagementApi.recordDose(medicationId, { ... });
```

## Testing

### Integration Tests (Jest)

Located in `backend/test/integration/`

```bash
cd backend

# Run all integration tests
npm test

# Run specific test file
npm test auth.integration.spec.ts

# Watch mode
npm run test:watch
```

### E2E Tests (Playwright)

Located in `tests/e2e/`

```bash
cd tests/e2e

# Install dependencies
npm install

# Install browsers
npm run install-browsers

# Run tests
npm test

# Run with UI
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Run specific browser
npm run test:chrome
npm run test:firefox
npm run test:safari
npm run test:mobile
```

### Test Coverage

**Integration Tests:**
- ✅ User registration
- ✅ User login
- ✅ JWT authentication
- ✅ Password management
- ✅ API Gateway proxying
- ✅ Service health checks

**E2E Tests:**
- ✅ Login flow with demo accounts
- ✅ Registration flow
- ✅ Dashboard navigation
- ✅ Unified dashboard data display
- ✅ Role-based access control
- ✅ Logout flow

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://eldercare:eldercare_password@localhost:5432/eldercare_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# IoT
IOT_TOKEN_SECRET=your-iot-gateway-secret-change-in-production

# API Gateway
LEGACY_SERVER_URL=http://localhost:5000
MONITORING_SERVER_URL=http://localhost:4000

# Server
PORT=3001
NODE_ENV=development
```

### React Client (.env)

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_MONITORING_URL=http://localhost:4000
```

### Next.js Frontend (.env)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development Workflow

### 1. Start Databases

```bash
docker-compose up postgres mongodb -d
```

### 2. Start Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 3. Start Frontends

```bash
# Terminal 1 - React Client
cd client
npm install
npm start

# Terminal 2 - Next.js Frontend
cd frontend
npm install
npm run dev
```

### 4. Start Legacy Services (Optional)

```bash
# Terminal 3 - Legacy Server
cd server
npm install
npm run dev

# Terminal 4 - Monitoring Backend
cd monitoring-backend
npm install
npm run dev
```

## Production Deployment

### Using Docker Compose

```bash
# Build all images
docker-compose build

# Start with nginx reverse proxy
docker-compose --profile production up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

### Using Kubernetes (Advanced)

See `k8s/` directory for Kubernetes manifests.

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs postgres

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker exec -it eldercare-postgres psql -U eldercare -d eldercare_db

# Check MongoDB
docker exec -it eldercare-mongodb mongosh
```

### Authentication Errors

```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check token in browser console
localStorage.getItem('eldercare_token')

# Test auth endpoint
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eldercare.com","password":"admin123"}'
```

### API Gateway Not Working

```bash
# Check service health
curl http://localhost:3001/gateway/health

# Check environment variables
docker-compose exec backend env | grep SERVER_URL

# Test direct connection
curl http://localhost:5000/api/health
curl http://localhost:4000/api/health
```

## Security Best Practices

1. **Change Default Secrets**: Update `JWT_SECRET` and `IOT_TOKEN_SECRET` in production
2. **Use HTTPS**: Enable SSL/TLS with nginx reverse proxy
3. **Implement Rate Limiting**: Add rate limiting to auth endpoints
4. **Sanitize Inputs**: All user inputs are validated with class-validator
5. **CORS Configuration**: Update allowed origins in production
6. **Database Credentials**: Use strong passwords and rotate regularly
7. **Token Expiration**: JWT tokens expire after 7 days

## Performance Optimization

1. **API Gateway Caching**: Implement Redis for caching frequent requests
2. **Database Indexes**: Critical queries use indexed columns
3. **Connection Pooling**: PostgreSQL and MongoDB use connection pools
4. **CDN Integration**: Serve static assets from CDN in production
5. **Load Balancing**: Use nginx or cloud load balancer for multiple backend instances

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/alovladi007/ElderCare-Advanced/issues
- Documentation: See README.md and PLATFORM_ANALYSIS.md
- Email: support@eldercare.example.com

## License

MIT License - see LICENSE file for details
