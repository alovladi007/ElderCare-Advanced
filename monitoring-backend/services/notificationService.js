const nodemailer = require('nodemailer');
const User = require('../models/User');
const Patient = require('../models/Patient');

// Email transporter configuration
const createEmailTransporter = () => {
  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  return null;
};

// Twilio configuration
const getTwilioClient = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio');
      return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (error) {
      console.error('Twilio not configured:', error.message);
      return null;
    }
  }
  return null;
};

/**
 * Send alert notifications to assigned healthcare providers
 * @param {Object} alert - Alert document from database
 * @param {Object} patient - Patient document from database
 */
async function sendAlertNotifications(alert, patient) {
  try {
    // Get all users who should be notified
    const usersToNotify = await getUsersToNotify(alert, patient);

    console.log(`Sending notifications for alert ${alert._id} to ${usersToNotify.length} users`);

    const notifications = [];

    for (const user of usersToNotify) {
      // Check user's notification preferences
      const prefs = user.notificationPreferences || {};

      // Check quiet hours
      if (prefs.quietHours?.enabled && isInQuietHours(prefs.quietHours)) {
        // Skip if it's not a critical alert during quiet hours
        if (alert.severity !== 'critical') {
          console.log(`Skipping notification for ${user.email} - quiet hours`);
          continue;
        }
      }

      // Check severity threshold
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
      if (prefs.alertSeverityThreshold) {
        const userThreshold = severityLevels[prefs.alertSeverityThreshold] || 1;
        const alertLevel = severityLevels[alert.severity] || 1;
        if (alertLevel < userThreshold) {
          console.log(`Skipping notification for ${user.email} - below severity threshold`);
          continue;
        }
      }

      // Send notifications based on preferences
      const sentNotifications = [];

      // Email notification
      if (prefs.email?.enabled !== false && user.email) {
        const emailSent = await sendEmailNotification(user, alert, patient);
        if (emailSent) {
          sentNotifications.push({
            sentTo: user._id,
            method: 'email',
            sentAt: new Date(),
            delivered: true
          });
        }
      }

      // SMS notification
      if (prefs.sms?.enabled && user.phoneNumber) {
        const smsSent = await sendSMSNotification(user, alert, patient);
        if (smsSent) {
          sentNotifications.push({
            sentTo: user._id,
            method: 'sms',
            sentAt: new Date(),
            delivered: true
          });
        }
      }

      // Push notification (stub - would integrate with Firebase/OneSignal)
      if (prefs.push?.enabled) {
        const pushSent = await sendPushNotification(user, alert, patient);
        if (pushSent) {
          sentNotifications.push({
            sentTo: user._id,
            method: 'push',
            sentAt: new Date(),
            delivered: true
          });
        }
      }

      notifications.push(...sentNotifications);
    }

    // Update alert with notification records
    if (notifications.length > 0) {
      alert.notifications = alert.notifications || [];
      alert.notifications.push(...notifications);
      await alert.save();
    }

    return notifications;
  } catch (error) {
    console.error('Error sending alert notifications:', error);
    throw error;
  }
}

/**
 * Get users who should be notified about an alert
 */
async function getUsersToNotify(alert, patient) {
  const userIds = new Set();

  // Add assigned doctor
  if (patient.assignedDoctor) {
    userIds.add(patient.assignedDoctor.toString());
  }

  // Add family members (for high and critical alerts)
  if (alert.severity === 'high' || alert.severity === 'critical') {
    if (patient.familyMembers && patient.familyMembers.length > 0) {
      patient.familyMembers.forEach(id => userIds.add(id.toString()));
    }
  }

  // Add caregivers
  if (patient.caregivers && patient.caregivers.length > 0) {
    patient.caregivers.forEach(id => userIds.add(id.toString()));
  }

  // For critical alerts, notify all doctors with emergency override
  if (alert.severity === 'critical') {
    const emergencyDoctors = await User.find({
      role: 'doctor',
      'permissions.emergencyOverride': true,
      isActive: true
    });
    emergencyDoctors.forEach(doc => userIds.add(doc._id.toString()));
  }

  // Fetch all users
  const users = await User.find({ _id: { $in: Array.from(userIds) }, isActive: true });
  return users;
}

/**
 * Check if current time is in user's quiet hours
 */
function isInQuietHours(quietHours) {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMin] = (quietHours.start || '22:00').split(':').map(Number);
  const [endHour, endMin] = (quietHours.end || '07:00').split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Handle overnight quiet hours
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Send email notification
 */
async function sendEmailNotification(user, alert, patient) {
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      console.log('Email not configured - would send email to', user.email);
      return false;
    }

    const severityColors = {
      low: '#3b82f6',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title} - ${patient.firstName} ${patient.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">⚠️ ${alert.title}</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Severity: ${alert.severity.toUpperCase()}</p>
          </div>

          <div style="padding: 20px; background-color: #f9fafb;">
            <h2>Patient Information</h2>
            <p><strong>Name:</strong> ${patient.firstName} ${patient.lastName}</p>
            <p><strong>MRN:</strong> ${patient.medicalRecordNumber || 'N/A'}</p>
            <p><strong>Date of Birth:</strong> ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>

            <h2>Alert Details</h2>
            <p><strong>Type:</strong> ${alert.alertType}</p>
            <p><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
            <p><strong>Message:</strong> ${alert.message}</p>

            ${alert.location?.room ? `<p><strong>Location:</strong> ${alert.location.room}</p>` : ''}
            ${alert.deviceId ? `<p><strong>Device ID:</strong> ${alert.deviceId}</p>` : ''}
          </div>

          <div style="padding: 20px; background-color: #ffffff; border-top: 2px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is an automated notification from the ElderCare Advanced Monitoring System.
              Please log in to the dashboard to view full details and take action.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${user.email} for alert ${alert._id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${user.email}:`, error.message);
    return false;
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(user, alert, patient) {
  try {
    const twilioClient = getTwilioClient();
    if (!twilioClient) {
      console.log('SMS not configured - would send SMS to', user.phoneNumber);
      return false;
    }

    const message = `[${alert.severity.toUpperCase()}] ${alert.title}\nPatient: ${patient.firstName} ${patient.lastName}\n${alert.message}\nTime: ${new Date(alert.createdAt).toLocaleString()}`;

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phoneNumber
    });

    console.log(`SMS sent to ${user.phoneNumber} for alert ${alert._id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send SMS to ${user.phoneNumber}:`, error.message);
    return false;
  }
}

/**
 * Send push notification (stub - integrate with Firebase Cloud Messaging or OneSignal)
 */
async function sendPushNotification(user, alert, patient) {
  // This would integrate with Firebase Cloud Messaging or OneSignal
  console.log(`Push notification for ${user.email} - Alert: ${alert.title}`);

  // Example Firebase integration (commented out):
  /*
  const admin = require('firebase-admin');

  if (user.fcmToken) {
    const message = {
      notification: {
        title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        body: alert.message
      },
      data: {
        alertId: alert._id.toString(),
        patientId: patient._id.toString(),
        severity: alert.severity,
        type: alert.alertType
      },
      token: user.fcmToken
    };

    await admin.messaging().send(message);
    return true;
  }
  */

  return false;
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(user, temporaryPassword = null) {
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      console.log('Email not configured - would send welcome email to', user.email);
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to ElderCare Advanced Monitoring System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Welcome to ElderCare Advanced</h1>
          </div>

          <div style="padding: 20px;">
            <p>Hello ${user.firstName} ${user.lastName},</p>

            <p>Your account has been created for the ElderCare Advanced Health Monitoring System.</p>

            <p><strong>Your Account Details:</strong></p>
            <ul>
              <li>Email: ${user.email}</li>
              <li>Role: ${user.role}</li>
              ${temporaryPassword ? `<li>Temporary Password: <code>${temporaryPassword}</code></li>` : ''}
            </ul>

            ${temporaryPassword ? '<p><strong>Important:</strong> Please change your password after your first login.</p>' : ''}

            <p>You can access the monitoring dashboard at: <a href="${process.env.CLIENT_URL || 'http://localhost:24610'}">ElderCare Monitoring Dashboard</a></p>

            <p>If you have any questions, please contact your system administrator.</p>

            <p>Best regards,<br>ElderCare Advanced Team</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send welcome email to ${user.email}:`, error.message);
    return false;
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user, resetToken) {
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      console.log('Email not configured - would send reset email to', user.email);
      return false;
    }

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:24610'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request - ElderCare Advanced',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Password Reset Request</h1>
          </div>

          <div style="padding: 20px;">
            <p>Hello ${user.firstName} ${user.lastName},</p>

            <p>We received a request to reset your password for your ElderCare Advanced account.</p>

            <p>Click the button below to reset your password:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>

            <p><strong>This link will expire in 1 hour.</strong></p>

            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>

            <p>Best regards,<br>ElderCare Advanced Team</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send reset email to ${user.email}:`, error.message);
    return false;
  }
}

module.exports = {
  sendAlertNotifications,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailNotification,
  sendSMSNotification,
  sendPushNotification
};
