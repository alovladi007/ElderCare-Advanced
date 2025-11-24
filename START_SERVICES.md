# 🚀 How to Start the ElderCare Platform

You're getting **ERR_CONNECTION_REFUSED** because the services aren't running yet. Follow these steps to start them:

## ✅ Prerequisites Check

Before starting, make sure you have:

- [ ] **Docker Desktop** installed and **running** (check your system tray/menu bar)
- [ ] **Node.js** >= 16.0.0 installed (for manual setup)
- [ ] **Terminal/Command Prompt** open

## 🐳 Option 1: Start with Docker (EASIEST - Recommended)

### Step 1: Make Sure Docker Desktop is Running

**Mac:** Look for the Docker whale icon in your menu bar (top right)
**Windows:** Look for Docker icon in system tray (bottom right)

If Docker isn't running:
1. Open **Docker Desktop** application
2. Wait for it to fully start (the whale icon will stop animating)

### Step 2: Start All Services

Open your terminal in the project directory and run:

```bash
# Navigate to the project directory
cd "/Users/vladimirantoine/EVER GREEN  Updated/ElderCare-Advanced"

# Start all services
docker-compose up -d
```

This will start:
- PostgreSQL database
- MongoDB database
- Redis cache
- Backend API
- Monitoring Backend
- Frontend applications

### Step 3: Initialize the Database

Wait about 30 seconds for services to start, then run:

```bash
# Initialize the backend database
docker-compose exec backend npx prisma migrate deploy

# Seed with demo data
docker-compose exec backend npm run seed
```

### Step 4: Check if Everything is Running

```bash
# View running containers
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

You should see 8 containers running:
- eldercare-postgres
- eldercare-mongodb
- eldercare-redis
- eldercare-backend
- eldercare-monitoring
- eldercare-legacy-server
- eldercare-frontend-react
- eldercare-frontend-next

### Step 5: Access the Platform

Now these URLs should work:

- **Landing Page**: http://localhost:7500
- **Backend API Docs**: http://localhost:7501/api/docs
- **Smart Home UI**: http://localhost:7502
- **Monitoring**: http://localhost:4100

---

## 💻 Option 2: Manual Setup (Without Docker)

If you prefer not to use Docker or need to develop:

### Prerequisites

Make sure you have installed:
- Node.js >= 16.0.0
- PostgreSQL >= 15 (running on port 5532)
- MongoDB >= 6 (running on port 27117)
- Redis (optional, on port 6479)

### Terminal 1 - Start PostgreSQL & MongoDB

If not already running, start your databases:

```bash
# PostgreSQL (on Mac with Homebrew)
brew services start postgresql@15

# MongoDB (on Mac with Homebrew)
brew services start mongodb-community@6

# Or use Docker just for databases
docker run -d -p 5532:5432 -e POSTGRES_PASSWORD=eldercare_password --name eldercare-postgres postgres:15-alpine
docker run -d -p 27117:27017 -e MONGO_INITDB_ROOT_USERNAME=eldercare -e MONGO_INITDB_ROOT_PASSWORD=eldercare_password --name eldercare-mongodb mongo:6-focal
```

### Terminal 2 - Backend (Port 3101)

```bash
cd backend

# Install dependencies (first time only)
npm install

# Run database migrations (first time only)
npm run prisma:migrate
npm run prisma:generate

# Seed data (first time only)
npm run seed

# Start the backend
npm run dev
```

**Wait for**: "Application is running on: http://localhost:7501"

### Terminal 3 - Monitoring Backend (Port 4100)

```bash
cd monitoring-backend

# Install dependencies (first time only)
npm install

# Seed data (first time only)
npm run seed

# Start monitoring backend
npm run dev
```

**Wait for**: "Monitoring backend listening on port 4100"

### Terminal 4 - React Client (Port 3100)

```bash
cd client

# Install dependencies (first time only)
npm install

# Start the React app
npm start
```

**Wait for**: Browser should open to http://localhost:7500

### Terminal 5 - Next.js Frontend (Port 3102)

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start Next.js
npm run dev
```

**Wait for**: "Ready on http://localhost:7502"

---

## 🔍 Troubleshooting

### "Docker not found" or "Cannot connect to Docker daemon"

**Solution**: Install or start Docker Desktop
- Download: https://www.docker.com/products/docker-desktop
- Mac: Make sure Docker Desktop app is running
- Windows: Ensure Docker Desktop is running and WSL2 is enabled

### "Port already in use" errors

**Solution**: The old services might still be running

```bash
# Stop Docker containers
docker-compose down

# Check what's using the ports
lsof -i :7500
lsof -i :7501
lsof -i :7502
lsof -i :4100

# Kill process (replace PID with actual process ID)
kill -9 PID

# Restart services
docker-compose up -d
```

### "npm: command not found"

**Solution**: Install Node.js
- Download: https://nodejs.org/
- Recommended: Use Node.js 18 LTS or 20 LTS

### Services start but pages don't load

**Solution**: Wait a bit longer, then check logs

```bash
# Check if services are healthy
docker-compose ps

# View logs for specific service
docker-compose logs backend
docker-compose logs monitoring-backend
docker-compose logs frontend-react

# Restart a specific service
docker-compose restart backend
```

### Database connection errors

**Solution**: Make sure databases are running and accessible

```bash
# Test PostgreSQL connection
docker-compose exec postgres psql -U eldercare -d eldercare_db -c "SELECT version();"

# Test MongoDB connection
docker-compose exec mongodb mongosh -u eldercare -p eldercare_password --eval "db.adminCommand('ping')"

# If databases aren't starting, check logs
docker-compose logs postgres
docker-compose logs mongodb
```

### "Module not found" or "Cannot find package" errors

**Solution**: Reinstall dependencies

```bash
# For Docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# For manual setup
cd backend && npm install
cd ../monitoring-backend && npm install
cd ../client && npm install
cd ../frontend && npm install
```

---

## 🎯 Quick Commands Reference

### Docker Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Restart all services
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose ps

# Execute command in container
docker-compose exec backend sh
```

### Manual Commands

```bash
# Start backend
cd backend && npm run dev

# Start monitoring
cd monitoring-backend && npm run dev

# Start React client
cd client && npm start

# Start Next.js
cd frontend && npm run dev

# Run database migrations
cd backend && npm run prisma:migrate

# Seed database
cd backend && npm run seed
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. **Docker**: All 8 containers show as "Up" in `docker-compose ps`
2. **Manual**: Each terminal shows the service is listening on its port
3. **Browser**:
   - http://localhost:7500 shows the landing page
   - http://localhost:7501/api/docs shows Swagger documentation
   - http://localhost:7502 shows the Smart Home UI
   - http://localhost:4100 (should respond, even if just with JSON)

---

## 📞 Still Having Issues?

1. Check [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md) for port details
2. Make sure no other applications are using ports 3100-3102, 4100, 5100, 5532, 27117, 6479
3. Restart Docker Desktop completely
4. Try `docker-compose down -v` (removes volumes) then `docker-compose up -d`

---

## 🎉 Once Running

Login credentials:
```
Admin:     admin@eldercare.com / admin123
Doctor:    doctor@eldercare.com / doctor123
Nurse:     nurse@eldercare.com / nurse123
Family:    family@eldercare.com / family123
Caregiver: caregiver@eldercare.com / caregiver123
Elder:     elder@eldercare.com / elder123
```

Enjoy your ElderCare Advanced Platform! 🏥
