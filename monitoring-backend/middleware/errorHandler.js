/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses and logging
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error wrapper - eliminates need for try/catch in route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle Mongoose validation errors
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value '${value}' for field '${field}'. Please use another value.`;
  return new AppError(message, 409, 'DUPLICATE_KEY');
};

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
};

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
};

/**
 * Send error response in development mode (includes stack trace)
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      stack: err.stack,
      details: err
    }
  });
};

/**
 * Send error response in production mode (user-friendly, no stack trace)
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        errorCode: err.errorCode
      }
    });
  }
  // Programming or unknown error: don't leak error details
  else {
    console.error('ERROR 💥:', err);

    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong. Please try again later.',
        errorCode: 'INTERNAL_ERROR'
      }
    });
  }
};

/**
 * Global error handling middleware
 * Should be placed at the end of all routes
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    // Handle specific error types
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.code === 11000) error = handleDuplicateKeyError(error);
    if (error.name === 'CastError') error = handleCastError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

/**
 * Handle 404 - Not Found errors
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  // Give the server time to finish processing current requests
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

/**
 * Logger for errors with additional context
 */
const logError = (err, req = null) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: err.message,
    statusCode: err.statusCode,
    errorCode: err.errorCode,
    stack: err.stack
  };

  if (req) {
    errorLog.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      user: req.user?.email
    };
  }

  console.error('Error Log:', JSON.stringify(errorLog, null, 2));

  // Here you could also send to external logging service
  // e.g., Sentry, LogRocket, CloudWatch, etc.
};

/**
 * Common error types for convenience
 */
const ErrorTypes = {
  NotFound: (resource) => new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  Unauthorized: (message = 'Unauthorized access') => new AppError(message, 401, 'UNAUTHORIZED'),
  Forbidden: (message = 'You do not have permission to perform this action') =>
    new AppError(message, 403, 'FORBIDDEN'),
  BadRequest: (message) => new AppError(message, 400, 'BAD_REQUEST'),
  Conflict: (message) => new AppError(message, 409, 'CONFLICT'),
  InternalError: (message = 'Internal server error') => new AppError(message, 500, 'INTERNAL_ERROR')
};

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFound,
  logError,
  ErrorTypes
};
