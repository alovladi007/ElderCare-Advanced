/**
 * Additional Security Middleware
 * Includes input sanitization, audit logging, and security headers
 */

const AuditLog = require('../models/AuditLog');

/**
 * Audit logging middleware - logs all sensitive operations
 */
const auditLogger = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function(data) {
      // Log the action after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logData = {
          user: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          action,
          resourceType,
          resourceId: req.params.id || req.params.patientId || data?.data?._id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          timestamp: new Date()
        };

        // Log asynchronously without blocking response
        AuditLog.create(logData).catch(err => {
          console.error('Failed to create audit log:', err);
        });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Input sanitization middleware - prevents XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;

    // Remove HTML tags
    let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove potential SQL injection patterns
    sanitized = sanitized.replace(/('|(--)|;|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter)/gi, '');

    return sanitized.trim();
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Validate request origin for sensitive operations
 */
const validateOrigin = (req, res, next) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:24610').split(',');

  const origin = req.get('origin') || req.get('referer');

  if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).json({
      message: 'Request from unauthorized origin'
    });
  }

  next();
};

/**
 * Detect and block suspicious patterns
 */
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\.\.|\/\/)/g, // Path traversal
    /(union|select|from|where)/gi, // SQL injection keywords
    /<script|javascript:|onerror=/gi, // XSS patterns
    /(\$ne|\$gt|\$lt|\$regex)/gi, // NoSQL injection
  ];

  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.url;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn('Suspicious activity detected:', {
        ip: req.ip,
        user: req.user?.email,
        url: req.url,
        pattern: pattern.toString()
      });

      return res.status(400).json({
        message: 'Invalid request detected'
      });
    }
  }

  next();
};

/**
 * Request size limiter to prevent memory exhaustion
 */
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');

    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseInt(maxSize);

      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          message: `Request size exceeds maximum allowed size of ${maxSize}`
        });
      }
    }

    next();
  };
};

/**
 * HIPAA-compliant security headers
 */
const hipaaSecurityHeaders = (req, res, next) => {
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Session timeout checker
 */
const sessionTimeout = (timeoutMinutes = 30) => {
  return (req, res, next) => {
    if (req.user && req.user.lastActivity) {
      const now = Date.now();
      const lastActivity = new Date(req.user.lastActivity).getTime();
      const elapsed = (now - lastActivity) / 1000 / 60; // minutes

      if (elapsed > timeoutMinutes) {
        return res.status(401).json({
          message: 'Session expired due to inactivity',
          code: 'SESSION_TIMEOUT'
        });
      }
    }

    next();
  };
};

module.exports = {
  auditLogger,
  sanitizeInput,
  validateOrigin,
  detectSuspiciousActivity,
  requestSizeLimiter,
  hipaaSecurityHeaders,
  sessionTimeout
};
