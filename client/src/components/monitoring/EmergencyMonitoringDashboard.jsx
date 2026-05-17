import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Heart,
  AlertTriangle,
  Phone,
  Building2,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Bell,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import api from '../../utils/axios';

const EmergencyMonitoringDashboard = ({ elderId }) => {
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [healthcareProviders, setHealthcareProviders] = useState([]);
  const [emergencyServices, setEmergencyServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({});

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [elderId]);

  const loadMonitoringData = async () => {
    try {
      const [statusRes, alertsRes, contactsRes, providersRes, servicesRes] = await Promise.all([
        api.get(`/care-management/emergency/monitoring/status/${elderId}`),
        api.get(`/care-management/emergency/alert/history/${elderId}?days=7`),
        api.get(`/care-management/emergency/emergency-contact/${elderId}`),
        api.get(`/care-management/emergency/healthcare-provider/${elderId}`),
        api.get(`/care-management/emergency/emergency-service/${elderId}`),
      ]);

      setMonitoringStatus(statusRes.data);
      setAlerts(alertsRes.data);
      setEmergencyContacts(contactsRes.data);
      setHealthcareProviders(providersRes.data);
      setEmergencyServices(servicesRes.data);
      setConfig(statusRes.data.config || {});
      setLoading(false);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      setLoading(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      if (monitoringStatus?.isMonitoring) {
        await api.post(`/care-management/emergency/monitoring/stop/${elderId}`);
      } else {
        await api.post(`/care-management/emergency/monitoring/start/${elderId}`);
      }
      await loadMonitoringData();
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await api.post(`/care-management/emergency/alert/${alertId}/acknowledge`, {
        userId: 'current-user-id', // Should come from auth context
        notes: 'Acknowledged from dashboard',
      });
      await loadMonitoringData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const triggerManualAlert = async () => {
    try {
      await api.post('/care-management/emergency/alert', {
        elderId,
        severity: 'MEDIUM',
        type: 'MEDICAL',
        title: 'Manual Alert Triggered',
        message: 'Alert manually triggered from monitoring dashboard',
      });
      await loadMonitoringData();
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  };

  const updateConfig = async () => {
    try {
      await api.put(`/care-management/emergency/monitoring/config/${elderId}`, config);
      setShowConfigModal(false);
      await loadMonitoringData();
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: 'bg-red-500',
      HIGH: 'bg-orange-500',
      WARNING: 'bg-yellow-500',
      MEDIUM: 'bg-yellow-500',
      INFO: 'bg-blue-500',
      LOW: 'bg-blue-500',
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getHealthStatusIcon = (status) => {
    if (status === 'critical') return <AlertTriangle className="w-6 h-6 text-red-500" />;
    if (status === 'warning') return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    return <CheckCircle className="w-6 h-6 text-green-500" />;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-blue-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">24/7 Emergency Monitoring</h1>
              <p className="text-gray-400">Real-time health monitoring and emergency alerts</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={triggerManualAlert}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Bell className="w-5 h-5" />
                Trigger Alert
              </button>
              <button
                onClick={setShowConfigModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Monitoring Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${monitoringStatus?.isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <h2 className="text-xl font-bold text-white">Monitoring Status</h2>
            </div>
            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                monitoringStatus?.isMonitoring
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {monitoringStatus?.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                {getHealthStatusIcon(monitoringStatus?.healthSummary?.healthStatus)}
                <span className="text-sm text-gray-400">Health Status</span>
              </div>
              <p className="text-2xl font-bold text-white capitalize">
                {monitoringStatus?.healthSummary?.healthStatus || 'Unknown'}
              </p>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <span className="text-sm text-gray-400">Active Alerts</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {alerts.filter(a => a.status === 'ACTIVE').length}
              </p>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-blue-500" />
                <span className="text-sm text-gray-400">Last Check</span>
              </div>
              <p className="text-sm font-medium text-white">
                {monitoringStatus?.lastCheckTime ? new Date(monitoringStatus.lastCheckTime).toLocaleTimeString() : 'N/A'}
              </p>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-green-500" />
                <span className="text-sm text-gray-400">Check Interval</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {monitoringStatus?.config?.vitalCheckInterval || 300}s
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Latest Vitals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              Latest Vital Signs
            </h2>
            <div className="space-y-3">
              {Object.entries(monitoringStatus?.latestVitals || {}).map(([type, vital]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-400">{type.replace('_', ' ')}</span>
                    <p className="text-lg font-bold text-white">
                      {vital.systolic ? `${vital.systolic}/${vital.diastolic}` : vital.value} {vital.unit}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(vital.recordedAt).toLocaleString()}
                    </span>
                  </div>
                  {getTrendIcon(vital.trend)}
                </div>
              ))}
              {Object.keys(monitoringStatus?.latestVitals || {}).length === 0 && (
                <p className="text-gray-400 text-center py-4">No recent vital readings</p>
              )}
            </div>
          </motion.div>

          {/* Active Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-yellow-500" />
              Recent Alerts
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4 bg-gray-700/50 rounded-lg border-l-4"
                  style={{ borderLeftColor: alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'WARNING' || alert.severity === 'HIGH' ? '#f59e0b' : '#3b82f6' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${getSeverityColor(alert.severity)} text-white`}>
                          {alert.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          alert.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400' :
                          alert.status === 'ACKNOWLEDGED' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      <h3 className="text-white font-medium">{alert.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                      <span className="text-xs text-gray-500 mt-2 block">
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </span>
                    </div>
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-gray-400 text-center py-4">No recent alerts</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Emergency Contacts & Providers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Emergency Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Phone className="w-6 h-6 text-blue-500" />
              Emergency Contacts
            </h2>
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-medium">{contact.name}</h3>
                    {contact.isPrimary && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">PRIMARY</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{contact.relationship}</p>
                  <p className="text-sm text-gray-300 mt-1">{contact.phone}</p>
                  {contact.email && <p className="text-sm text-gray-400">{contact.email}</p>}
                </div>
              ))}
              {emergencyContacts.length === 0 && (
                <p className="text-gray-400 text-center py-4">No emergency contacts</p>
              )}
            </div>
          </motion.div>

          {/* Healthcare Providers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-green-500" />
              Healthcare Providers
            </h2>
            <div className="space-y-3">
              {healthcareProviders.map((provider) => (
                <div key={provider.id} className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-medium">{provider.name}</h3>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      {provider.type}
                    </span>
                  </div>
                  {provider.phone && <p className="text-sm text-gray-300">{provider.phone}</p>}
                  {provider.email && <p className="text-sm text-gray-400">{provider.email}</p>}
                  {provider.address && (
                    <p className="text-xs text-gray-500 mt-1">
                      {provider.address}, {provider.city}, {provider.state}
                    </p>
                  )}
                </div>
              ))}
              {healthcareProviders.length === 0 && (
                <p className="text-gray-400 text-center py-4">No healthcare providers</p>
              )}
            </div>
          </motion.div>

          {/* Emergency Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-500" />
              Emergency Services
            </h2>
            <div className="space-y-3">
              {emergencyServices.map((service) => (
                <div key={service.id} className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-medium">{service.name}</h3>
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                      {service.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{service.phone}</p>
                  {service.email && <p className="text-sm text-gray-400">{service.email}</p>}
                </div>
              ))}
              {emergencyServices.length === 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">⚠️ No emergency services configured</p>
                  <p className="text-gray-400 text-xs mt-1">Add 911 or local emergency contacts</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Monitoring Configuration</h2>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-white mb-2">
                    <input
                      type="checkbox"
                      checked={config.enabled !== false}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    Enable Monitoring
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Check Interval (seconds)</label>
                    <input
                      type="number"
                      value={config.vitalCheckInterval || 300}
                      onChange={(e) => setConfig({ ...config, vitalCheckInterval: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Inactivity Timeout (seconds)</label>
                    <input
                      type="number"
                      value={config.inactivityTimeout || 3600}
                      onChange={(e) => setConfig({ ...config, inactivityTimeout: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Quiet Hours Start</label>
                    <input
                      type="time"
                      value={config.quietHoursStart || ''}
                      onChange={(e) => setConfig({ ...config, quietHoursStart: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Quiet Hours End</label>
                    <input
                      type="time"
                      value={config.quietHoursEnd || ''}
                      onChange={(e) => setConfig({ ...config, quietHoursEnd: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={config.notifyFamily !== false}
                      onChange={(e) => setConfig({ ...config, notifyFamily: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    Notify Family Members
                  </label>

                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={config.notifyHealthcare !== false}
                      onChange={(e) => setConfig({ ...config, notifyHealthcare: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    Notify Healthcare Providers
                  </label>

                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={config.notifyEmergency !== false}
                      onChange={(e) => setConfig({ ...config, notifyEmergency: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    Notify Emergency Services
                  </label>

                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={config.autoEscalateCritical !== false}
                      onChange={(e) => setConfig({ ...config, autoEscalateCritical: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    Auto-Escalate Critical Alerts
                  </label>
                </div>

                {config.autoEscalateCritical !== false && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Escalation Delay (seconds)</label>
                    <input
                      type="number"
                      value={config.escalationDelay || 300}
                      onChange={(e) => setConfig({ ...config, escalationDelay: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={updateConfig}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
                >
                  Save Configuration
                </button>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyMonitoringDashboard;
