const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user has access to specific patient
exports.checkPatientAccess = async (req, res, next) => {
  const patientId = req.params.patientId || req.body.patient;

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  // Admins and doctors with emergency override can access all patients
  if (req.user.role === 'admin' || (req.user.role === 'doctor' && req.user.permissions.emergencyOverride)) {
    return next();
  }

  // Check if user has access to this specific patient
  const hasAccess = req.user.assignedPatients.some(
    id => id.toString() === patientId.toString()
  );

  if (!hasAccess) {
    return res.status(403).json({ message: 'Access denied to this patient' });
  }

  next();
};

// Check specific permission
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions[permission]) {
      return res.status(403).json({
        message: `You do not have permission to ${permission}`
      });
    }
    next();
  };
};
