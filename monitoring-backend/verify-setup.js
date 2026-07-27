#!/usr/bin/env node
/**
 * ElderCare Advanced - Setup Verification Script
 *
 * This script checks if all required configurations are properly set up
 * Run: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n========================================');
console.log('🔍 ElderCare Advanced - Setup Verification');
console.log('========================================\n');

let allChecksPassed = true;
const warnings = [];
const errors = [];

// Helper functions
const checkMark = '✅';
const crossMark = '❌';
const warnMark = '⚠️';

function checkRequired(name, value, description) {
  if (!value || value.includes('your-') || value.includes('change-this')) {
    errors.push(`${name}: ${description}`);
    console.log(`${crossMark} ${name}: Missing or not configured`);
    allChecksPassed = false;
    return false;
  } else {
    console.log(`${checkMark} ${name}: Configured`);
    return true;
  }
}

function checkOptional(name, value, description) {
  if (!value || value.includes('your-')) {
    warnings.push(`${name}: ${description} (Optional but recommended)`);
    console.log(`${warnMark} ${name}: Not configured (optional)`);
    return false;
  } else {
    console.log(`${checkMark} ${name}: Configured`);
    return true;
  }
}

// 1. Check .env file exists
console.log('📋 Checking Configuration Files...\n');

if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.log(`${crossMark} .env file: Missing`);
  console.log('   → Create .env file from .env.example\n');
  errors.push('Create .env file in monitoring-backend directory');
  allChecksPassed = false;
} else {
  console.log(`${checkMark} .env file: Found\n`);
}

// 2. Check required environment variables
console.log('🔐 Checking Required Configuration...\n');

checkRequired(
  'PORT',
  process.env.PORT,
  'Server port (default: 5001)'
);

checkRequired(
  'MONGODB_URI',
  process.env.MONGODB_URI,
  'MongoDB connection string'
);

const jwtSecretCheck = process.env.JWT_SECRET &&
  process.env.JWT_SECRET.length >= 32 &&
  !process.env.JWT_SECRET.includes('your-secret-key-change-in-production');

if (jwtSecretCheck) {
  console.log(`${checkMark} JWT_SECRET: Configured (${process.env.JWT_SECRET.length} characters)`);
} else {
  console.log(`${crossMark} JWT_SECRET: Missing or insecure`);
  errors.push('Set a strong JWT_SECRET (minimum 32 characters)');
  allChecksPassed = false;
}

checkRequired(
  'CLIENT_URL',
  process.env.CLIENT_URL,
  'Frontend URL for CORS'
);

// 3. Check notification configuration
console.log('\n📧 Checking Notification Configuration...\n');

const emailConfigured = checkOptional(
  'EMAIL_USER',
  process.env.EMAIL_USER,
  'Email address for sending notifications'
);

if (emailConfigured) {
  checkOptional(
    'EMAIL_PASSWORD',
    process.env.EMAIL_PASSWORD,
    'Email password or app password'
  );
  checkOptional(
    'EMAIL_SERVICE',
    process.env.EMAIL_SERVICE,
    'Email service provider (gmail, outlook, etc.)'
  );
}

const twilioConfigured = checkOptional(
  'TWILIO_ACCOUNT_SID',
  process.env.TWILIO_ACCOUNT_SID,
  'Twilio Account SID for SMS notifications'
);

if (twilioConfigured) {
  checkOptional(
    'TWILIO_AUTH_TOKEN',
    process.env.TWILIO_AUTH_TOKEN,
    'Twilio Auth Token'
  );
  checkOptional(
    'TWILIO_PHONE_NUMBER',
    process.env.TWILIO_PHONE_NUMBER,
    'Twilio phone number'
  );
}

// 4. Check security configuration
console.log('\n🔒 Checking Security Configuration...\n');

if (process.env.NODE_ENV === 'production') {
  console.log(`${checkMark} NODE_ENV: production`);

  // Production-specific checks
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
    warnings.push('Using localhost MongoDB in production - consider MongoDB Atlas');
    console.log(`${warnMark} MONGODB_URI: Using localhost (not recommended for production)`);
  }

  if (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('localhost')) {
    warnings.push('CLIENT_URL points to localhost in production');
    console.log(`${warnMark} CLIENT_URL: Points to localhost (update for production)`);
  }
} else {
  console.log(`${warnMark} NODE_ENV: ${process.env.NODE_ENV || 'development'} (set to "production" when deploying)`);
}

checkOptional(
  'ALLOWED_ORIGINS',
  process.env.ALLOWED_ORIGINS,
  'Comma-separated list of allowed CORS origins'
);

// 5. Check optional configurations
console.log('\n⚙️  Checking Optional Configuration...\n');

checkOptional(
  'REDIS_URL',
  process.env.REDIS_URL,
  'Redis URL for distributed rate limiting'
);

checkOptional(
  'LOG_LEVEL',
  process.env.LOG_LEVEL,
  'Logging level (error, warn, info, debug)'
);

// 6. Check package dependencies
console.log('\n📦 Checking Dependencies...\n');

const packageJson = require('./package.json');
const requiredDeps = [
  'express',
  'mongoose',
  'socket.io',
  'jsonwebtoken',
  'bcryptjs',
  'cors',
  'helmet',
  'express-rate-limit',
  'compression',
  'nodemailer',
  'twilio'
];

let depsInstalled = true;
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`${checkMark} ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`${crossMark} ${dep}: Not found`);
    errors.push(`Install ${dep} with: npm install ${dep}`);
    depsInstalled = false;
    allChecksPassed = false;
  }
});

if (depsInstalled) {
  try {
    require.resolve('express');
    console.log(`\n${checkMark} Dependencies: All installed`);
  } catch (e) {
    console.log(`\n${warnMark} Dependencies: Found in package.json but not in node_modules`);
    warnings.push('Run "npm install" to install dependencies');
  }
}

// 7. Check database connection
console.log('\n🗄️  Checking Database Connection...\n');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log(`${checkMark} MongoDB: Connected successfully`);
    console.log(`   → Database: ${mongoose.connection.name}`);
    console.log(`   → Host: ${mongoose.connection.host}`);

    mongoose.connection.close();
    printSummary();
  })
  .catch((error) => {
    console.log(`${crossMark} MongoDB: Connection failed`);
    console.log(`   → Error: ${error.message}`);
    errors.push('Check MONGODB_URI and ensure MongoDB is running');
    allChecksPassed = false;

    printSummary();
  });

// Summary function
function printSummary() {
  console.log('\n========================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('========================================\n');

  if (allChecksPassed && errors.length === 0) {
    console.log(`${checkMark} All critical checks passed!\n`);
  } else {
    console.log(`${crossMark} ${errors.length} critical issue(s) found:\n`);
    errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`${warnMark} ${warnings.length} warning(s):\n`);
    warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
    console.log('');
  }

  // Next steps
  console.log('========================================');
  console.log('🚀 NEXT STEPS');
  console.log('========================================\n');

  if (errors.length > 0) {
    console.log('Fix the critical issues above, then run this script again.\n');
  } else if (warnings.length > 0) {
    console.log('Configuration is functional, but consider addressing warnings for production use.\n');
  } else {
    console.log('✅ Your setup is complete and ready!\n');
    console.log('To start the server:');
    console.log('   npm run dev     (development mode with auto-reload)');
    console.log('   npm start       (production mode)\n');
    console.log('Server will be available at: http://localhost:' + (process.env.PORT || 31613));
    console.log('API endpoints: http://localhost:' + (process.env.PORT || 31613) + '/api\n');
  }

  if (!emailConfigured && !twilioConfigured) {
    console.log(`${warnMark} Note: Notifications are not configured.`);
    console.log('   Alerts will be logged to console but not sent via email/SMS.');
    console.log('   To enable notifications, configure EMAIL_* or TWILIO_* variables in .env\n');
  }

  console.log('For detailed documentation, see: README.md');
  console.log('For help, visit: https://github.com/alovladi007/ElderCare-Advanced\n');

  process.exit(errors.length > 0 ? 1 : 0);
}
