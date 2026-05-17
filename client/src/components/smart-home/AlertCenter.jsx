import React, { useState, useEffect } from 'react';
import { Bell, Filter, Search, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Card, Badge, Button, Loading, Alert, Input, Select } from '..';
import { smartHomeService } from '../../services';

const AlertCenter = ({ homeId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAlerts();

    // Setup WebSocket connection for real-time alerts
    const ws = setupWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, [homeId]);

  const setupWebSocket = () => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
      const ws = new WebSocket(`${wsUrl}/smarthome/alerts?homeId=${homeId}`);

      ws.onopen = () => {
        console.log('WebSocket connected to alert center');
      };

      ws.onmessage = (event) => {
        try {
          const newAlert = JSON.parse(event.data);
          setAlerts((prev) => [newAlert, ...prev]);

          // Show browser notification for critical alerts
          if (newAlert.severity === 'CRITICAL' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Critical Alert', {
                body: newAlert.message,
                icon: '/alert-icon.png',
              });
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Real-time connection error. Alerts may be delayed.');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (homeId) setupWebSocket();
        }, 5000);
      };

      return ws;
    } catch (err) {
      console.error('Failed to setup WebSocket:', err);
      return null;
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await smartHomeService.getAlerts(homeId);
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await smartHomeService.markAlertAsRead(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
    } catch (err) {
      setError(`Failed to mark alert as read: ${err.message}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      await smartHomeService.markAllAlertsAsRead(homeId);
      setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })));
    } catch (err) {
      setError(`Failed to mark all alerts as read: ${err.message}`);
    }
  };

  const deleteAlert = async (alertId) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await smartHomeService.deleteAlert(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (err) {
      setError(`Failed to delete alert: ${err.message}`);
    }
  };

  const getAlertIcon = (severity) => {
    const iconMap = {
      CRITICAL: AlertTriangle,
      WARNING: AlertCircle,
      INFO: Info,
    };
    return iconMap[severity] || Bell;
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      CRITICAL: { variant: 'danger', text: 'Critical' },
      WARNING: { variant: 'warning', text: 'Warning' },
      INFO: { variant: 'info', text: 'Info' },
    };
    return variants[severity] || { variant: 'default', text: 'Unknown' };
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'read' && alert.isRead) ||
      (statusFilter === 'unread' && !alert.isRead);
    const matchesSearch =
      searchQuery === '' ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alertType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading alerts..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header with Actions */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Alert Center
              {unreadCount > 0 && (
                <Badge variant="danger" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </h2>
            <p className="text-gray-400 text-sm">
              Real-time notifications and system alerts
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={CheckCheck}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="bg-white/5 text-white hover:bg-white/10"
          >
            Mark All Read
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-white/10 backdrop-blur-md border-white/20">
          <p className="text-gray-300 text-sm">Total Alerts</p>
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
        </Card>
        <Card padding="sm" className="bg-blue-500/20 border-blue-500/50">
          <p className="text-blue-200 text-sm">Unread</p>
          <p className="text-2xl font-bold text-white">{unreadCount}</p>
        </Card>
        <Card padding="sm" className="bg-red-500/20 border-red-500/50">
          <p className="text-red-200 text-sm">Critical</p>
          <p className="text-2xl font-bold text-white">
            {alerts.filter((a) => a.severity === 'CRITICAL').length}
          </p>
        </Card>
        <Card padding="sm" className="bg-orange-500/20 border-orange-500/50">
          <p className="text-orange-200 text-sm">Today</p>
          <p className="text-2xl font-bold text-white">
            {alerts.filter(
              (a) =>
                new Date(a.createdAt).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              inputClassName="bg-white/10 border-white/20 text-white placeholder-gray-400"
              className="mb-0"
            />
          </div>
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Severities' },
              { value: 'CRITICAL', label: 'Critical' },
              { value: 'WARNING', label: 'Warning' },
              { value: 'INFO', label: 'Info' },
            ]}
            className="mb-0 md:w-48"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
            ]}
            className="mb-0 md:w-48"
          />
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card padding="lg" className="bg-white/10 backdrop-blur-md border-white/20">
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {alerts.length === 0 ? 'No Alerts Yet' : 'No Matching Alerts'}
              </h3>
              <p className="text-gray-400">
                {alerts.length === 0
                  ? 'All clear! No alerts to display.'
                  : 'Try adjusting your filters to see more alerts.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.severity);
            const severityBadge = getSeverityBadge(alert.severity);

            return (
              <Card
                key={alert.id}
                padding="normal"
                className={`bg-white/10 backdrop-blur-md border-white/20 ${
                  !alert.isRead ? 'ring-2 ring-blue-500/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-500/20'
                        : alert.severity === 'WARNING'
                        ? 'bg-orange-500/20'
                        : 'bg-blue-500/20'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        alert.severity === 'CRITICAL'
                          ? 'text-red-400'
                          : alert.severity === 'WARNING'
                          ? 'text-orange-400'
                          : 'text-blue-400'
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold">{alert.alertType}</h3>
                        <Badge variant={severityBadge.variant}>{severityBadge.text}</Badge>
                        {!alert.isRead && (
                          <Badge variant="info" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 mb-2">{alert.message}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.device && (
                        <span>Device: {alert.device.name}</span>
                      )}
                      {alert.sensor && (
                        <span>Sensor: {alert.sensor.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={CheckCheck}
                        onClick={() => markAsRead(alert.id)}
                        className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                        title="Mark as read"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => deleteAlert(alert.id)}
                      className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      title="Delete"
                    />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertCenter;
