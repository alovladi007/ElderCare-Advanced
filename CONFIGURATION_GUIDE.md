# ElderCare Advanced - Configuration Guide 🔧

This guide will walk you through configuring all services for your ElderCare Advanced platform.

## 📋 Table of Contents

1. [Gmail Setup for Email Notifications](#1-gmail-setup-for-email-notifications)
2. [Twilio Setup for SMS Notifications](#2-twilio-setup-for-sms-notifications)
3. [MongoDB Atlas Setup](#3-mongodb-atlas-setup)
4. [Environment Variables Configuration](#4-environment-variables-configuration)
5. [Testing Your Configuration](#5-testing-your-configuration)
6. [Production Deployment Checklist](#6-production-deployment-checklist)

---

## 1. Gmail Setup for Email Notifications 📧

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com
2. Sign in with **m.y.engineering@abpsystemsandhardware.com**
3. Navigate to **Security** → **2-Step Verification**
4. Follow the prompts to enable 2FA (required for App Passwords)

### Step 2: Generate App Password

1. Go to App Passwords: https://myaccount.google.com/apppasswords
2. Sign in if prompted
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Enter name: `ElderCare Backend`
6. Click **GENERATE**
7. Copy the 16-character password (example: `abcd efgh ijkl mnop`)
8. Remove spaces: `abcdefghijklmnop`

### Step 3: Update .env File

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=m.y.engineering@abpsystemsandhardware.com
EMAIL_PASSWORD=abcdefghijklmnop  # Your generated app password (no spaces)
EMAIL_FROM_NAME=ElderCare Advanced Monitoring
```

### Testing Email Configuration

```bash
# Test by submitting a vital reading that triggers an alert
# The system will automatically send email notifications
```

---

## 2. Twilio Setup for SMS Notifications 📱

### Step 1: Create Twilio Account

1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your phone number

### Step 2: Get Your Credentials

1. Go to Twilio Console: https://console.twilio.com/
2. From the Dashboard, copy:
   - **Account SID** (starts with "AC...")
   - **Auth Token** (click "View" to reveal)

### Step 3: Get a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a number (trial accounts get one free number)
3. Complete the purchase
4. Copy your new phone number (format: +1234567890)

### Step 4: Update .env File

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Replace with your Account SID
TWILIO_AUTH_TOKEN=your_auth_token_here  # Replace with your Auth Token
TWILIO_PHONE_NUMBER=+1234567890  # Replace with your Twilio number
```

### Trial Account Limitations

- Free trial includes $15 credit
- Can only send SMS to verified phone numbers
- Messages will include trial disclaimer
- To remove limitations, upgrade to paid account

### Adding Verified Numbers (Trial Only)

1. Go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
2. Click **Add a new number**
3. Enter phone number and verify via SMS

---

## 3. MongoDB Atlas Setup ☁️

### Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Choose **Free Shared Cluster** (M0)

### Step 2: Create a Cluster

1. Click **Build a Database**
2. Choose **Free Shared** tier
3. Select your cloud provider and region (choose nearest to your users)
4. Click **Create Cluster** (takes 3-5 minutes)

### Step 3: Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Choose **Password** authentication method
4. Username: `eldercare-admin`
5. Password: Generate a strong password (save it!)
6. Database User Privileges: **Atlas admin** or **Read and write to any database**
7. Click **Add User**

### Step 4: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. For development/testing:
   - Click **Allow Access from Anywhere**
   - IP Address: `0.0.0.0/0`
4. For production:
   - Add specific IP addresses of your servers
5. Click **Confirm**

### Step 5: Get Connection String

1. Go to **Database** (left sidebar)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Select **Driver**: Node.js, **Version**: 4.1 or later
5. Copy the connection string:
   ```
   mongodb+srv://eldercare-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update .env File

```bash
# Replace <password> with your actual database user password
# Add database name after .net/
MONGODB_URI=mongodb+srv://eldercare-admin:YourPassword123@cluster0.xxxxx.mongodb.net/evergreen-monitoring?retryWrites=true&w=majority
```

**Important**: Replace `<password>` with your actual password (URL-encode special characters)

### URL Encoding Special Characters

If your password contains special characters, encode them:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `^` → `%5E`
- `&` → `%26`
- `*` → `%2A`

Example: If password is `Pass@123!`, use `Pass%40123%21`

---

## 4. Environment Variables Configuration ⚙️

### Complete .env File Template

Your `.env` file is already created with a secure JWT secret. Here's what you need to configure:

```bash
# Server Configuration
PORT=5001
NODE_ENV=production  # Set to 'development' for local testing

# Database (UPDATE THIS)
MONGODB_URI=mongodb+srv://eldercare-admin:YourPassword@cluster0.xxxxx.mongodb.net/evergreen-monitoring?retryWrites=true&w=majority

# Security (ALREADY CONFIGURED - DO NOT CHANGE)
JWT_SECRET=29116894451b1eb115d86c4e2cc07747c11edd30c94362f52638b8a2d9d99c9614b7cc8e6e082b7f8ab244cbafcbbd132471085bb610b4caf361ceae92f7c6a5

# Client URL
CLIENT_URL=http://localhost:3000  # Update for production
ALLOWED_ORIGINS=http://localhost:3000,https://alovladi007.github.io

# Email (UPDATE THIS)
EMAIL_SERVICE=gmail
EMAIL_USER=m.y.engineering@abpsystemsandhardware.com
EMAIL_PASSWORD=your-gmail-app-password  # From Gmail setup above

# SMS (UPDATE THIS)
TWILIO_ACCOUNT_SID=your-account-sid  # From Twilio setup above
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Quick Configuration Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured
- [ ] `MONGODB_URI` updated in .env
- [ ] Gmail 2FA enabled
- [ ] Gmail App Password generated
- [ ] `EMAIL_PASSWORD` updated in .env
- [ ] Twilio account created
- [ ] Twilio credentials obtained
- [ ] `TWILIO_*` variables updated in .env

---

## 5. Testing Your Configuration 🧪

### Step 1: Verify Setup

```bash
cd /home/user/ElderCare-Advanced/monitoring-backend
node verify-setup.js
```

This script will check:
- ✅ .env file exists
- ✅ All required variables are set
- ✅ Dependencies are installed
- ✅ MongoDB connection works
- ✅ JWT secret is secure

### Step 2: Start the Backend

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
Monitoring Server running on port 5001
WebSocket server ready for real-time monitoring
MongoDB connected: evergreen-monitoring
```

### Step 3: Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:5001/health

# Should return:
# {"status":"OK","timestamp":"...","uptime":123,"environment":"production"}
```

### Step 4: Test Email Notifications

1. Create a test patient with monitoring enabled
2. Submit a vital reading that exceeds thresholds
3. Check your email for alert notification

### Step 5: Test SMS Notifications

1. Ensure user has SMS notifications enabled
2. Add verified phone number (if using Twilio trial)
3. Trigger an alert by submitting abnormal vital
4. Check phone for SMS alert

### Common Issues & Solutions

**Issue**: `MongoNetworkError: connection timed out`
- **Solution**: Check Network Access in MongoDB Atlas, ensure your IP is whitelisted

**Issue**: `Authentication failed` (MongoDB)
- **Solution**: Verify database username and password, check for URL-encoded special characters

**Issue**: Email not sending
- **Solution**: Verify Gmail App Password is correct (no spaces), check EMAIL_SERVICE is set to 'gmail'

**Issue**: SMS not sending
- **Solution**: Verify phone number is verified in Twilio (trial accounts), check TWILIO credentials

**Issue**: `CORS error` from frontend
- **Solution**: Add frontend URL to ALLOWED_ORIGINS in .env

---

## 6. Production Deployment Checklist ✅

### Pre-Deployment

- [ ] `NODE_ENV=production` in .env
- [ ] Strong JWT_SECRET configured (already done ✓)
- [ ] MongoDB Atlas (not localhost) configured
- [ ] Gmail App Password configured
- [ ] Twilio credentials configured (optional)
- [ ] `ALLOWED_ORIGINS` includes production domain
- [ ] `CLIENT_URL` points to production frontend
- [ ] All dependencies installed: `npm install`
- [ ] Verification passed: `node verify-setup.js`

### Security Checklist

- [ ] .env file is in .gitignore (never commit!)
- [ ] HTTPS/SSL enabled on production server
- [ ] Firewall configured (only necessary ports open)
- [ ] MongoDB Atlas IP whitelist configured for production IPs only
- [ ] Rate limiting configured (already enabled ✓)
- [ ] CORS origins restricted to your domains only
- [ ] All service accounts have 2FA enabled

### Performance Checklist

- [ ] MongoDB indexes created (automatic with models)
- [ ] Compression enabled (already enabled ✓)
- [ ] Logging configured appropriately
- [ ] Process manager (PM2) configured for auto-restart
- [ ] Server has sufficient resources (2GB+ RAM recommended)

### Monitoring Checklist

- [ ] Error logging set up (consider Sentry)
- [ ] Uptime monitoring configured
- [ ] Database backups enabled (MongoDB Atlas has automatic backups)
- [ ] Audit logs reviewed regularly

---

## 📞 Support

If you encounter any issues:

1. Run the verification script: `node verify-setup.js`
2. Check server logs for errors
3. Review this configuration guide
4. Check the main README.md for additional documentation

---

## 🎉 Congratulations!

Once all configurations are complete and tests pass, your ElderCare Advanced platform is ready for production use!

**Next**: Start the frontend and begin monitoring patients in real-time!

```bash
# In a new terminal
cd /home/user/ElderCare-Advanced/client
npm install
npm start
```

Visit: http://localhost:3000
