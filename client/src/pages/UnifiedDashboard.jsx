import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  Activity,
  AlertTriangle,
  Calendar,
  Pill,
  Heart,
  Shield,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { elderProfileApi, smartHomeApi, careManagementApi } from '../../../shared/api/api.client';

const UnifiedDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedElder, setSelectedElder] = useState(null);
  const [elders, setElders] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // For admin/clinician/caregiver - load all elders
      if (['ADMIN', 'CLINICIAN', 'CAREGIVER'].includes(user?.role)) {
        const eldersResponse = await elderProfileApi.getAllElders();
        setElders(eldersResponse.data);
        if (eldersResponse.data.length > 0) {
          setSelectedElder(eldersResponse.data[0].id);
          await loadElderDashboard(eldersResponse.data[0].id);
        }
      } else {
        // For family/elder - load their own dashboard
        // This would need their elderProfileId - for demo, we'll mock it
        const mockElderId = 'elder-1';
        await loadElderDashboard(mockElderId);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadElderDashboard = async (elderId) => {
    try {
      const response = await elderProfileApi.getDashboard(elderId);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load elder dashboard:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Active Alerts',
      value: dashboardData?.summary?.activeAlerts || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
    {
      label: 'Today\'s Tasks',
      value: dashboardData?.summary?.pendingTasks || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      label: 'Medications',
      value: dashboardData?.summary?.activeMedications || 0,
      icon: Pill,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      label: 'Upcoming Appointments',
      value: dashboardData?.summary?.upcomingAppointments || 0,
      icon: Heart,
      color: 'text-green-600',
      bg: 'bg-green-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">ElderCare</h1>
                <p className="text-xs text-gray-500">Advanced Platform</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg">
            <HomeIcon className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Dashboard</span>}
          </button>
          <button
            onClick={() => navigate('/monitoring/dashboard')}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
          >
            <Activity className="w-5 h-5" />
            {sidebarOpen && <span>Health Monitor</span>}
          </button>
          <button
            onClick={() => navigate('/smart-home')}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
          >
            <Shield className="w-5 h-5" />
            {sidebarOpen && <span>Smart Home</span>}
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-5 h-5" />
              {sidebarOpen && <span>Admin</span>}
            </button>
          )}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="mb-3">
              <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.role}</p>
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2">
              <span className="text-white font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your care recipients
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Alerts</h2>
              {dashboardData?.alerts?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.alerts.slice(0, 5).map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{alert.type}</p>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No active alerts</p>
              )}
            </motion.div>

            {/* Today's Medications */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Medications</h2>
              {dashboardData?.medications?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.medications.slice(0, 5).map((med, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Pill className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-600">{med.dosage}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{med.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No medications scheduled</p>
              )}
            </motion.div>

            {/* Upcoming Appointments */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
              {dashboardData?.appointments?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.appointments.slice(0, 4).map((appt, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{appt.title}</p>
                        <p className="text-sm text-gray-600">{appt.provider}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(appt.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
              )}
            </motion.div>

            {/* Care Tasks */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Care Tasks</h2>
              {dashboardData?.tasks?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.tasks.slice(0, 4).map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.description}</p>
                        <p className="text-sm text-gray-600">{task.frequency}</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded"
                        checked={task.status === 'COMPLETED'}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No tasks for today</p>
              )}
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
          >
            <h2 className="text-xl font-bold mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/monitoring/dashboard')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all"
              >
                <Activity className="w-8 h-8 mb-2 mx-auto" />
                <p className="text-sm font-medium">Health Monitor</p>
              </button>
              <button
                onClick={() => navigate('/smart-home')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all"
              >
                <Shield className="w-8 h-8 mb-2 mx-auto" />
                <p className="text-sm font-medium">Smart Home</p>
              </button>
              <button
                onClick={() => navigate('/booking')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all"
              >
                <Calendar className="w-8 h-8 mb-2 mx-auto" />
                <p className="text-sm font-medium">Book Service</p>
              </button>
              <button
                onClick={() => navigate('/care-guide')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all"
              >
                <Heart className="w-8 h-8 mb-2 mx-auto" />
                <p className="text-sm font-medium">Care Guide</p>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
