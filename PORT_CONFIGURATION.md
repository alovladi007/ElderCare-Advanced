# Port Configuration Guide 🔌

## Overview

Due to port conflicts on your system, all services have been configured to use alternative ports. This document provides the complete port mapping.

## 🚨 Port Conflicts Detected

The following standard ports were already in use and have been remapped:

| Standard Port | Service Type | Status | New Port |
|--------------|--------------|--------|----------|
| 3000 | React Client | ❌ IN USE | **7500** |
| 3001 | Backend API | ❌ IN USE | **7501** |
| 3002 | Next.js Frontend | ❌ IN USE | **7502** |
| 4000 | Monitoring Backend | ❌ IN USE | **4100** |
| 5000 | Legacy Server | ❌ IN USE | **5100** |
| 5432 | PostgreSQL | ❌ IN USE | **5532** |
| 6379 | Redis | ❌ IN USE | **6479** |
| 27017 | MongoDB | ⚠️ CAUTION | **27117** |

## 🌐 New Localhost URLs

### Main Applications

| Service | New URL | Description |
|---------|---------|-------------|
| **Landing Page (React)** | http://localhost:7500 | Main website entry point |
| **Smart Home Dashboard** | http://localhost:7502 | Next.js smart home UI |
| **Backend API** | http://localhost:7501 | Primary NestJS API |
| **API Documentation** | http://localhost:7501/api/docs | Swagger docs |
| **Monitoring API** | http://localhost:4100 | Health monitoring |
| **Legacy Server** | http://localhost:5100 | Service catalog |

### API Endpoints

**Backend API (Port 7501):**
- Authentication: http://localhost:7501/api/auth
- Elder Profiles: http://localhost:7501/api/elder-profile
- Smart Home: http://localhost:7501/api/homes
- Devices: http://localhost:7501/api/devices
- Bookings: http://localhost:7501/api/bookings

**Monitoring API (Port 4100):**
- Patients: http://localhost:4100/api/patients
- Vitals: http://localhost:4100/api/vitals
- Alerts: http://localhost:4100/api/alerts
- Analytics: http://localhost:4100/api/analytics
- Devices: http://localhost:4100/api/devices

**Legacy Server (Port 5100):**
- Services: http://localhost:5100/api/services
- Bookings: http://localhost:5100/api/bookings
- Contact: http://localhost:5100/api/contact

### Database Connections

| Database | New Port | Connection String |
|----------|----------|-------------------|
| **PostgreSQL** | 5532 | `postgresql://eldercare:eldercare_password@localhost:5532/eldercare_db` |
| **MongoDB** | 27117 | `mongodb://eldercare:eldercare_password@localhost:27117` |
| **Redis** | 6479 | `redis://localhost:6479` |

## 📝 Configuration Files Updated

The following files have been updated with the new ports:

### ✅ Docker Compose
- [docker-compose.yml](docker-compose.yml)
  - All service port mappings updated
  - Environment variables updated

### ✅ Backend Configuration
- [backend/.env](backend/.env)
  - `PORT=7501`
  - `DATABASE_URL=postgresql://...@localhost:5532/...`
  - `FRONTEND_URL=http://localhost:7500`

### ✅ Monitoring Backend Configuration
- [monitoring-backend/.env](monitoring-backend/.env)
  - `PORT=4100`
  - `MONGODB_URI=mongodb://localhost:27117/...`
  - `CLIENT_URL=http://localhost:7500`

## 🚀 Starting the Platform

### Option 1: Docker Compose (Recommended)

```bash
# Make sure Docker Desktop is running
docker-compose up -d

# Initialize database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed

# Check status
docker-compose ps

# Access the platform
open http://localhost:7500  # Landing page
open http://localhost:7501/api/docs  # API docs
open http://localhost:7502  # Smart home UI
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run prisma:migrate
npm run prisma:generate
npm run seed
npm run dev
# Runs on port 7501
```

**Terminal 2 - Monitoring Backend:**
```bash
cd monitoring-backend
npm install
npm run dev
# Runs on port 4100
```

**Terminal 3 - Next.js Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on port 7502
```

**Terminal 4 - React Client:**
```bash
cd client
npm install
npm start
# Runs on port 7500
```

## 🔍 Health Checks

Verify all services are running:

```bash
# Landing page
curl http://localhost:7500

# Backend API health
curl http://localhost:7501/api/docs

# Monitoring API
curl http://localhost:4100/api/patients

# Smart Home UI
curl http://localhost:7502
```

## 🔐 Login URLs

- **Main Login**: http://localhost:7500/login
- **Monitoring Login**: http://localhost:7500/monitoring/login
- **Registration**: http://localhost:7500/register
- **Admin Dashboard**: http://localhost:7500/dashboard
- **Smart Home Simulator**: http://localhost:7502/admin/simulator

## 🧪 Demo Credentials

```javascript
Admin:     admin@eldercare.com / admin123
Doctor:    doctor@eldercare.com / doctor123
Nurse:     nurse@eldercare.com / nurse123
Family:    family@eldercare.com / family123
Caregiver: caregiver@eldercare.com / caregiver123
Elder:     elder@eldercare.com / elder123
```

## 🛠️ Troubleshooting

### Port Still in Use?

If you still get port conflicts:

```bash
# Check what's using a port (example for 7500)
lsof -i :7500

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or restart Docker Desktop
```

### Can't Connect to Database?

```bash
# Check if databases are running
docker ps | grep -E 'postgres|mongo|redis'

# View logs
docker-compose logs postgres
docker-compose logs mongodb
docker-compose logs redis

# Restart a specific service
docker-compose restart postgres
```

### Services Not Starting?

```bash
# View all logs
docker-compose logs -f

# Rebuild containers
docker-compose down
docker-compose up -d --build

# Check for errors
docker-compose ps
```

## 📊 Port Mapping Summary

**Frontend Services:**
- React Client: `3000` → `7500`
- Backend API: `3001` → `7501`
- Next.js UI: `3002` → `7502`

**Backend Services:**
- Monitoring: `4000` → `4100`
- Legacy: `5000` → `5100`

**Databases:**
- PostgreSQL: `5432` → `5532`
- Redis: `6379` → `6479`
- MongoDB: `27017` → `27117`

## 🔄 Reverting to Standard Ports

If you want to use standard ports later (after freeing them up):

1. Stop all services: `docker-compose down`
2. Edit [docker-compose.yml](docker-compose.yml) and change ports back
3. Update [backend/.env](backend/.env) and [monitoring-backend/.env](monitoring-backend/.env)
4. Restart: `docker-compose up -d`

## 📝 Notes

- All **internal** container ports remain unchanged
- Only **external** (host) ports have been remapped
- Services communicate internally using original ports
- Database connections from outside Docker need new ports
- WebSocket connections use the new monitoring port (4100)

## ✅ Quick Reference Card

**Save this for quick access:**

```
Landing Page:     http://localhost:7500
Smart Home UI:    http://localhost:7502
API Docs:         http://localhost:7501/api/docs
Monitoring:       http://localhost:4100

PostgreSQL:       localhost:5532
MongoDB:          localhost:27117
Redis:            localhost:6479
```

---

**All configurations have been updated. The platform is ready to run on the new ports!** 🚀
