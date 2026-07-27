import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { Card, Badge, Loading, Alert } from '..';
import { smartHomeService } from '../../services';

const DashboardOverview = ({ homeId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [activeScenarios, setActiveScenarios] = useState([]);

  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [homeStatus, events, scenarios] = await Promise.all([
        smartHomeService.getHomeStatus(homeId),
        smartHomeService.getEvents(homeId, { limit: 10 }),
        smartHomeService.getActiveScenarios(homeId),
      ]);

      setStats(homeStatus);
      setRecentEvents(events);
      setActiveScenarios(scenarios);
    } catch (err) {
      setError(err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Alert type="error" dismissible onDismiss={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  const statCards = [
    {
      title: 'Total Devices',
      value: stats?.deviceCount || 0,
      icon: Activity,
      color: 'blue',
      trend: '+2 this week',
    },
    {
      title: 'Online Devices',
      value: stats?.onlineDevices || 0,
      icon: TrendingUp,
      color: 'green',
      trend: `${Math.round((stats?.onlineDevices / stats?.deviceCount) * 100 || 0)}% online`,
    },
    {
      title: 'Active Alerts',
      value: stats?.activeAlerts || 0,
      icon: AlertTriangle,
      color: stats?.activeAlerts > 0 ? 'red' : 'gray',
      trend: stats?.activeAlerts > 0 ? 'Requires attention' : 'All clear',
    },
    {
      title: 'Automation Rules',
      value: stats?.automationRules || 0,
      icon: Clock,
      color: 'purple',
      trend: `${stats?.enabledRules || 0} active`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Active Emergency Scenarios */}
      {activeScenarios.length > 0 && (
        <Alert type="warning" title="Active Emergency Scenarios">
          <div className="space-y-2 mt-2">
            {activeScenarios.map((scenario) => (
              <div key={scenario.id} className="flex items-center justify-between">
                <span className="font-medium">{scenario.scenario.name}</span>
                <Badge variant="warning">Active</Badge>
              </div>
            ))}
          </div>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-300 text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </div>
              <p className="text-sm text-gray-400">{stat.trend}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Events */}
      <Card
        title="Recent Activity"
        subtitle="Latest sensor events and system activities"
        padding="normal"
        className="bg-white/10 backdrop-blur-md border-white/20"
      >
        {recentEvents.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recent events</p>
        ) : (
          <div className="space-y-3">
            {recentEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{event.eventType}</p>
                  <p className="text-gray-400 text-sm">
                    {event.sensor?.name || 'Unknown sensor'} • {event.sensor?.device?.zone?.name || 'Unknown zone'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      event.severity === 'CRITICAL'
                        ? 'danger'
                        : event.severity === 'WARNING'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {event.severity}
                  </Badge>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(event.occurredAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="System Health"
          padding="normal"
          className="bg-white/10 backdrop-blur-md border-white/20"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Database</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">WebSocket</span>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">API Gateway</span>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Notification Service</span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </Card>

        <Card
          title="Quick Actions"
          padding="normal"
          className="bg-white/10 backdrop-blur-md border-white/20"
        >
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-white text-sm font-medium transition-colors">
              Add Device
            </button>
            <button className="p-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-white text-sm font-medium transition-colors">
              Create Rule
            </button>
            <button className="p-4 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-white text-sm font-medium transition-colors">
              Test Scenario
            </button>
            <button className="p-4 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-white text-sm font-medium transition-colors">
              View Logs
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
