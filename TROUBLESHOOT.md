# 🔧 Troubleshooting Guide - Getting Services Running

## Issue: "Not Working" / Services Won't Start

Follow these steps **in order**:

---

## Step 1: Is Docker Desktop Running?

**Mac**: Look at the **top-right corner** of your screen for a whale icon 🐋

### If you DON'T see the whale icon:
1. Open **Finder**
2. Go to **Applications**
3. Find and open **Docker Desktop**
4. Wait for the whale icon to appear in menu bar
5. Wait until whale stops animating (about 1-2 minutes)

### If you don't have Docker Desktop installed:
1. Download from: https://www.docker.com/products/docker-desktop
2. Install it
3. Open Docker Desktop
4. Come back here after it's running

---

## Step 2: Open Terminal

1. Press `Cmd + Space`
2. Type "Terminal"
3. Press Enter

---

## Step 3: Navigate to Project

In Terminal, copy and paste this **EXACT** command:

```bash
cd "/Users/vladimirantoine/EVER GREEN  Updated/ElderCare-Advanced"
```

Press Enter.

---

## Step 4: Run the Quick Start Script

Copy and paste this command:

```bash
./QUICK_START.sh
```

Press Enter.

### If you get "Permission denied":
Run this first:
```bash
chmod +x QUICK_START.sh
./QUICK_START.sh
```

---

## Step 5: OR Run Commands Manually

If the script doesn't work, run these commands **one at a time**:

```bash
# 1. Stop any existing containers
docker-compose down

# 2. Start all services
docker-compose up -d

# 3. Wait 30 seconds, then check status
docker-compose ps

# 4. Initialize database
docker-compose exec backend npx prisma migrate deploy

# 5. Add demo data
docker-compose exec backend npm run seed
```

---

## Step 6: Check if Services are Running

Run this command:

```bash
docker-compose ps
```

**You should see 8 services** all showing "Up":
- eldercare-postgres (Up, healthy)
- eldercare-mongodb (Up, healthy)
- eldercare-redis (Up, healthy)
- eldercare-backend (Up)
- eldercare-monitoring (Up)
- eldercare-legacy-server (Up)
- eldercare-frontend-react (Up)
- eldercare-frontend-next (Up)

### If services show "Exit" or "Restarting":

View the logs to see what's wrong:

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs monitoring-backend
docker-compose logs postgres
```

---

## Step 7: Test in Browser

Open your browser and try these URLs:

1. **http://localhost:7500** - Should show landing page
2. **http://localhost:7501/api/docs** - Should show API documentation
3. **http://localhost:7502** - Should show Smart Home UI

### If you get "This site can't be reached":

The service is still starting. Wait another minute and try again.

### If you get "Connection refused" AFTER waiting:

The service didn't start. Check logs:

```bash
docker-compose logs frontend-react
docker-compose logs backend
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to Docker daemon"

**Problem**: Docker Desktop isn't running

**Solution**:
1. Open Docker Desktop application
2. Wait for whale icon in menu bar
3. Try again

---

### Issue: "port is already allocated"

**Problem**: Another service is using the port

**Solution**:
```bash
# Stop all containers
docker-compose down

# Check what's using the ports
lsof -i :7500
lsof -i :7501

# If you see a process, kill it:
# kill -9 <PID>

# Try starting again
docker-compose up -d
```

---

### Issue: "No such service: backend"

**Problem**: Not in the right directory

**Solution**:
```bash
# Make sure you're in the project directory
cd "/Users/vladimirantoine/EVER GREEN  Updated/ElderCare-Advanced"

# Verify docker-compose.yml exists
ls docker-compose.yml

# Try again
docker-compose up -d
```

---

### Issue: Services start but pages are blank

**Problem**: Frontend needs to build

**Solution**:
```bash
# Rebuild containers
docker-compose down
docker-compose up -d --build

# Wait 2-3 minutes for build to complete
docker-compose logs -f frontend-react
```

---

### Issue: "Database connection failed"

**Problem**: Database not ready yet

**Solution**:
```bash
# Check database health
docker-compose ps postgres
docker-compose ps mongodb

# Wait for "healthy" status
# Then retry migrations:
docker-compose exec backend npx prisma migrate deploy
```

---

## Quick Commands Reference

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Restart everything
docker-compose restart

# View logs (all)
docker-compose logs -f

# View logs (one service)
docker-compose logs -f backend

# Check status
docker-compose ps

# Rebuild everything
docker-compose down
docker-compose up -d --build

# Delete everything and start fresh
docker-compose down -v
docker-compose up -d
```

---

## Still Not Working?

### Step 1: Take a Screenshot

Take a screenshot of:
1. Your terminal showing the error
2. Docker Desktop dashboard
3. Browser error message

### Step 2: Check These

Run these commands and note the output:

```bash
# Check Docker is running
docker --version

# Check compose file exists
ls -la docker-compose.yml

# Check current directory
pwd

# Check port availability
lsof -i :7500
```

### Step 3: Complete Reset

If nothing works, try a complete reset:

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d

# Wait 2 minutes
sleep 120

# Initialize
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

---

## Expected Startup Time

- **Database services**: 10-15 seconds
- **Backend services**: 30-45 seconds
- **Frontend services**: 1-2 minutes (first time, includes build)

**Total**: Allow **2-3 minutes** for complete startup.

---

## Success Checklist

- [ ] Docker Desktop is running (whale icon visible)
- [ ] In correct directory (`/Users/vladimirantoine/EVER GREEN  Updated/ElderCare-Advanced`)
- [ ] `docker-compose up -d` completed without errors
- [ ] `docker-compose ps` shows all 8 services "Up"
- [ ] Waited at least 2 minutes
- [ ] http://localhost:7500 loads in browser
- [ ] Can login with admin@eldercare.com / admin123

If all checked: ✅ **YOU'RE RUNNING!**

---

**Need more help?** Check:
- [START_SERVICES.md](START_SERVICES.md) - Detailed startup guide
- [PORT_AUDIT_COMPLETE.md](PORT_AUDIT_COMPLETE.md) - Port configuration
- [README.md](README.md) - Complete documentation
