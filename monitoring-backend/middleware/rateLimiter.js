/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks by limiting request rates
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Store in Redis if available, otherwise in-memory
  ...(process.env.REDIS_URL && {
    store: new RedisStore({
      sendCommand: (...args) => require('redis').createClient({ url: process.env.REDIS_URL }).sendCommand(args),
    }),
  })
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Moderate limiter for data submission endpoints
 * 50 requests per 15 minutes per IP
 */
const dataSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 submissions per windowMs
  message: {
    message: 'Too many data submissions from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Lenient limiter for read-only endpoints
 * 200 requests per 15 minutes per IP
 */
const readOnlyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 read requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Critical endpoint limiter (password reset, account recovery)
 * 3 attempts per hour per IP
 */
const criticalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 critical operations per hour
  message: {
    message: 'Too many critical operation attempts. Please try again later or contact support.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom rate limiter that tracks by user ID instead of IP
 * Useful for authenticated endpoints
 */
const createUserRateLimiter = (maxRequests, windowMinutes) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?._id?.toString();

    if (!userId) {
      return next(); // Skip if not authenticated
    }

    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMinutes} minutes.`,
        retryAfter: `${windowMinutes} minutes`
      });
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      const cutoff = now - windowMs * 2;
      for (const [id, timestamps] of requests.entries()) {
        const valid = timestamps.filter(t => now - t < windowMs * 2);
        if (valid.length === 0) {
          requests.delete(id);
        } else {
          requests.set(id, valid);
        }
      }
    }

    next();
  };
};

module.exports = {
  apiLimiter,
  authLimiter,
  dataSubmissionLimiter,
  readOnlyLimiter,
  criticalLimiter,
  createUserRateLimiter
};
