# ElderCare Advanced - Deployment & Testing Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Automated Setup
```bash
./setup.sh
```

This script will:
- ✅ Check PostgreSQL installation and status
- ✅ Create database and user
- ✅ Install backend dependencies
- ✅ Generate Prisma client
- ✅ Run database migrations
- ✅ Install frontend dependencies
- ✅ Create .env files if missing

---

## 📋 Manual Setup

### 1. Database Setup

```bash
# Install PostgreSQL (if not installed)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE eldercare_db;
CREATE USER eldercare WITH PASSWORD 'eldercare_password';
GRANT ALL PRIVILEGES ON DATABASE eldercare_db TO eldercare;
\q
EOF
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Update .env with your keys:
# - STRIPE_SECRET_KEY (from stripe.com)
# - SENDGRID_API_KEY (from sendgrid.com)
# - JWT_SECRET (generate random string)

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Start backend
npm run dev
```

Backend will start on: `http://localhost:3001`

### 3. Frontend Setup

```bash
cd client

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3002
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_APP_NAME=ElderCare Advanced
VITE_APP_VERSION=1.0.0
EOF

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend will start on: `http://localhost:3000`

---

## 🔑 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://eldercare:eldercare_password@localhost:5432/eldercare_db?schema=public"

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (Get from https://sendgrid.com)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM=noreply@eldercare.com
EMAIL_ADMIN=admin@eldercare.com

# WebSocket
WS_PORT=3002
WS_PATH=/socket.io

# Optional: Sentry Error Tracking
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENABLED=false
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3002
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
VITE_APP_NAME=ElderCare Advanced
VITE_APP_VERSION=1.0.0
```

---

## 🧪 Testing

### Automated API Testing
```bash
./test-features.sh
```

This tests:
- ✅ Health check endpoint
- ✅ Authentication endpoints
- ✅ Elder profile endpoints
- ✅ Care management endpoints
- ✅ Smart home endpoints
- ✅ Booking endpoints
- ✅ Payment endpoints
- ✅ Notification endpoints

### Manual Feature Testing

#### 1. Smart Home Dashboard
```bash
# Navigate to
http://localhost:3000/smart-home-hub

# Test:
- View device list
- Create automation rule
- Configure emergency scenario
- View real-time alerts
- Test WebSocket connection
```

#### 2. Elder Profile Management
```bash
# Navigate to
http://localhost:3000/elder-profile/123

# Test:
- Upload profile photo
- Add emergency contacts
- Add medical conditions
- Invite family members
- Update personal information
```

#### 3. Care Management
```bash
# Navigate to
http://localhost:3000/care-management/123

# Test:
- Add medication schedule
- Schedule appointments
- Record vital signs
- Create care tasks
- Drag-drop task status
```

#### 4. Booking & Payments
```bash
# Navigate to
http://localhost:3000/booking

# Test:
- Browse services
- Book a service
- Complete payment (use test card: 4242 4242 4242 4242)
- View payment history
- Download invoice
```

### Unit Tests (Backend)
```bash
cd backend
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### E2E Tests (if configured)
```bash
cd client
npm run test:e2e
```

---

## 🎨 Stripe Testing

### Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
3D Secure: 4000 0027 6000 3184

Expiry: Any future date
CVV: Any 3 digits
ZIP: Any 5 digits
```

### Stripe CLI (for webhooks)
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3001/api/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

---

## 📊 Database Management

### View Data
```bash
cd backend
npx prisma studio
```
Opens GUI at `http://localhost:5555`

### Reset Database
```bash
npx prisma migrate reset
```

### Seed Database
```bash
npx prisma db seed
```

### Backup Database
```bash
pg_dump -U eldercare eldercare_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -U eldercare eldercare_db < backup_20240101.sql
```

---

## 🔧 Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :3001
lsof -i :3000

# Kill process
kill -9 <PID>
```

### PostgreSQL Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Prisma Migration Errors
```bash
# Reset migrations
npx prisma migrate reset

# Force push schema
npx prisma db push --force-reset
```

### WebSocket Connection Issues
```bash
# Check if port 3002 is available
lsof -i :3002

# Update client .env
VITE_WS_URL=ws://localhost:3002
```

---

## 📦 Production Deployment

### Backend (Node.js)

```bash
# Build
npm run build

# Start production
NODE_ENV=production npm run start

# With PM2
pm2 start npm --name "eldercare-backend" -- start
pm2 save
pm2 startup
```

### Frontend (Static)

```bash
# Build
npm run build

# Serve with Nginx
# Copy dist/ to /var/www/eldercare
sudo cp -r dist/* /var/www/eldercare/
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Update JWT_SECRET to strong random string
- [ ] Use real Stripe production keys
- [ ] Enable HTTPS in production
- [ ] Set up CORS properly
- [ ] Enable rate limiting
- [ ] Configure Sentry for error tracking
- [ ] Set up database backups
- [ ] Enable PostgreSQL SSL
- [ ] Use environment-specific .env files
- [ ] Never commit .env files to git
- [ ] Rotate API keys regularly
- [ ] Enable two-factor authentication
- [ ] Set up monitoring and alerts

---

## 📈 Performance Optimization

### Backend
- Enable Redis caching
- Use connection pooling
- Optimize Prisma queries
- Enable gzip compression
- Set up CDN for static assets

### Frontend
- Enable code splitting
- Lazy load routes
- Optimize images
- Enable PWA caching
- Minimize bundle size

---

## 🆘 Support

### Documentation
- API Docs: `http://localhost:3001/api/docs`
- Database Schema: See `backend/prisma/schema.prisma`
- Component Library: See `FRONTEND_COMPONENT_LIBRARY.md`

### Logs
```bash
# Backend logs
tail -f backend/logs/combined.log

# Frontend logs (browser console)
# Error logs (if Sentry enabled)
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/api/health

# Database connection
curl http://localhost:3001/api/health/db

# Redis (if enabled)
curl http://localhost:3001/api/health/redis
```

---

## ✅ Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Stripe webhooks configured
- [ ] Email service configured
- [ ] WebSocket server running
- [ ] HTTPS enabled
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Error tracking enabled
- [ ] Performance monitoring setup
- [ ] Security audit completed

---

**Last Updated:** 2024
**Platform Version:** 1.0.0
