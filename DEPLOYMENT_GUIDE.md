# Deployment Guide - ElderCare & HomeCare Platform

## 🚀 Quick Setup Guide

### Local Development Setup

1. **Install Dependencies**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client && npm install
   cd ..
   ```

2. **Configure Environment**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env with your settings
   # Minimum required: MONGODB_URI and JWT_SECRET
   ```

3. **Start Development Servers**
   ```bash
   # Option 1: Run both servers concurrently (recommended)
   npm run dev

   # Option 2: Run servers separately
   # Terminal 1
   npm run server

   # Terminal 2
   npm run client
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/api/health

## 📦 Production Deployment

### Option 1: Deploy to Vercel (Frontend) + Railway (Backend)

#### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy the build folder to Vercel
# Or connect your GitHub repo to Vercel
```

#### Backend (Railway)
```bash
# Push to GitHub
# Connect Railway to your GitHub repository
# Set environment variables in Railway dashboard
```

### Option 2: Deploy to Heroku

```bash
# Backend deployment
heroku create eldercare-api
heroku addons:create mongolab
git push heroku main

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
```

### Option 3: Deploy to DigitalOcean/AWS

1. Set up a droplet/EC2 instance
2. Install Node.js and MongoDB
3. Clone the repository
4. Install dependencies
5. Configure environment variables
6. Use PM2 for process management
7. Set up Nginx as reverse proxy

## 🗄️ Database Setup

### MongoDB Atlas (Recommended for Production)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Set up database user
4. Whitelist your IP (or 0.0.0.0/0 for any IP)
5. Get connection string
6. Update MONGODB_URI in .env

### Local MongoDB

```bash
# Install MongoDB locally
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Use in .env
MONGODB_URI=mongodb://localhost:27017/eldercare
```

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV=production in production
- [ ] Enable HTTPS
- [ ] Configure CORS for specific origins
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Regular security updates

## 📧 Email Configuration (Optional)

For contact form notifications:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🧪 Testing

```bash
# Test backend API
npm run server
# Visit http://localhost:5000/api/health

# Test frontend
npm run client
# Visit http://localhost:3000
```

## 📊 Monitoring

Recommended tools:
- Backend: PM2 with monitoring
- Logging: Winston or Morgan
- Error tracking: Sentry
- Uptime monitoring: UptimeRobot

## 🆘 Troubleshooting

### Port already in use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
PORT=5001
```

### MongoDB connection error
- Check MONGODB_URI is correct
- Ensure MongoDB is running
- Check network/firewall settings
- Verify database user credentials

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules client/node_modules
npm run install-all
```

## 📝 Environment Variables Reference

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eldercare

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (for CORS)
CLIENT_URL=https://your-frontend-url.com
```

## 🎉 Success!

Your ElderCare & HomeCare platform should now be running!

For support or questions:
- Check README.md for detailed documentation
- Review API endpoints in server/routes/
- Check logs for error messages
