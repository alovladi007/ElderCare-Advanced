const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: String,
  userRole: String,
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create_patient',
      'update_patient',
      'view_patient',
      'delete_patient',
      'create_vital',
      'view_vitals',
      'create_alert',
      'acknowledge_alert',
      'resolve_alert',
      'update_monitoring_settings',
      'access_camera',
      'emergency_override',
      'contact_emergency_services',
      'export_data',
      'modify_user',
      'failed_login',
      'password_reset',
      'settings_change'
    ]
  },
  resourceType: {
    type: String,
    enum: ['patient', 'user', 'vital', 'alert', 'device', 'system']
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  method: String,
  url: String,
  statusCode: Number,
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient querying
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 2 years (HIPAA compliance)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

module.exports = mongoose.model('AuditLog', AuditLogSchema);
