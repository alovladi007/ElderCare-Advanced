import React, { useState, useEffect, useCallback } from 'react';
import { Pill, Calendar, ClipboardCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, Badge, Loading, Alert } from '..';
import careService from '../../services/care.service';

const CareOverview = ({ elderId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [upcomingDoses, setUpcomingDoses] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthSummary, doses, appointments] = await Promise.all([
        careService.getHealthSummary(elderId),
        careService.getUpcomingDoses(elderId),
        careService.getUpcomingAppointments(elderId),
      ]);

      setSummary(healthSummary);
      setUpcomingDoses(doses);
      setUpcomingAppointments(appointments);
    } catch (err) {
      setError(err.message || 'Failed to load care overview');
    } finally {
      setLoading(false);
    }
  }, [elderId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading care overview..." />;
  }

  if (error) {
    return (
      <Alert type="error" dismissible onDismiss={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  const stats = [
    {
      title: 'Active Medications',
      value: summary?.activeMedications || 0,
      icon: Pill,
      color: 'blue',
      trend: 'All on schedule',
    },
    {
      title: 'Upcoming Appointments',
      value: upcomingAppointments.length || 0,
      icon: Calendar,
      color: 'purple',
      trend: `Next: ${upcomingAppointments[0] ? new Date(upcomingAppointments[0].startTime).toLocaleDateString() : 'None'}`,
    },
    {
      title: 'Pending Tasks',
      value: summary?.pendingTasks || 0,
      icon: ClipboardCheck,
      color: 'orange',
      trend: summary?.pendingTasks > 0 ? 'Requires attention' : 'All complete',
    },
    {
      title: 'Health Score',
      value: summary?.healthScore || 85,
      icon: TrendingUp,
      color: 'green',
      trend: 'Stable',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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

      {/* Upcoming Doses */}
      <Card
        title="Today's Medications"
        subtitle="Upcoming medication doses"
        padding="normal"
        className="bg-white/10 backdrop-blur-md border-white/20"
      >
        {upcomingDoses.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No upcoming doses today</p>
        ) : (
          <div className="space-y-3">
            {upcomingDoses.slice(0, 5).map((dose) => (
              <div
                key={dose.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Pill className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      {dose.medication?.name}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {dose.medication?.dosage} • {new Date(dose.scheduledAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    dose.status === 'TAKEN'
                      ? 'success'
                      : dose.status === 'MISSED'
                      ? 'danger'
                      : 'default'
                  }
                >
                  {dose.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Appointments */}
      <Card
        title="Upcoming Appointments"
        subtitle="Scheduled medical visits"
        padding="normal"
        className="bg-white/10 backdrop-blur-md border-white/20"
      >
        {upcomingAppointments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No upcoming appointments</p>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 5).map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{appointment.title}</h4>
                    <p className="text-gray-400 text-sm">
                      {new Date(appointment.startTime).toLocaleDateString()} at{' '}
                      {new Date(appointment.startTime).toLocaleTimeString()}
                    </p>
                    {appointment.location && (
                      <p className="text-gray-500 text-xs">{appointment.location}</p>
                    )}
                  </div>
                </div>
                <Badge variant="info">{appointment.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Health Alerts */}
      {summary?.alerts && summary.alerts.length > 0 && (
        <Alert type="warning" title="Health Alerts">
          <div className="space-y-2 mt-2">
            {summary.alerts.map((alert, index) => (
              <div key={index} className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </Alert>
      )}
    </div>
  );
};

export default CareOverview;
