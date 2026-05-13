import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  MessageSquare,
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  Bell,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  Edit,
  Plus,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  User,
  Stethoscope,
  Clipboard,
  BarChart3,
  PieChart
} from 'lucide-react';
// import { useAuth } from '../shared/hooks/useAuth';
import { elderProfileApi, smartHomeApi, careManagementApi } from '../shared/api/api.client';

const UnifiedDashboard = () => {
  const navigate = useNavigate();
  // Mock user for demo access - no login required
  const user = { role: 'ADMIN', name: 'Demo User', email: 'demo@eldercare.com' };
  const logout = () => navigate('/');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedElder, setSelectedElder] = useState(null);
  const [elders, setElders] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [carePlans, setCarePlans] = useState([]);
  const [careTeam, setCareTeam] = useState([]);
  const [healthTrends, setHealthTrends] = useState([]);
  const [billing, setBilling] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadDashboard();
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock messages
    setMessages([
      { id: 1, from: 'Dr. Sarah Johnson', message: 'Mary is doing well with her new medication regimen.', time: '2 hours ago', unread: true },
      { id: 2, from: 'Nurse Michael Chen', message: 'Completed morning vitals check. All readings normal.', time: '4 hours ago', unread: true },
      { id: 3, from: 'Care Coordinator', message: 'Reminder: Annual care plan review scheduled for next week.', time: '1 day ago', unread: false }
    ]);

    // Mock documents
    setDocuments([
      { id: 1, name: 'Care Plan - 2024.pdf', type: 'Care Plan', date: '2024-01-15', size: '2.4 MB' },
      { id: 2, name: 'Medical Records Summary.pdf', type: 'Medical Record', date: '2024-01-10', size: '5.1 MB' },
      { id: 3, name: 'Medication List.pdf', type: 'Prescription', date: '2024-01-08', size: '156 KB' },
      { id: 4, name: 'Lab Results - Dec 2023.pdf', type: 'Lab Report', date: '2023-12-28', size: '890 KB' }
    ]);

    // Mock care plans
    setCarePlans([
      { id: 1, title: 'Diabetes Management Plan', status: 'Active', lastUpdated: '2024-01-15', progress: 85 },
      { id: 2, title: 'Hypertension Monitoring', status: 'Active', lastUpdated: '2024-01-10', progress: 92 },
      { id: 3, title: 'Physical Therapy Program', status: 'In Progress', lastUpdated: '2024-01-05', progress: 60 }
    ]);

    // Mock care team
    setCareTeam([
      { id: 1, name: 'Dr. Sarah Johnson', role: 'Primary Care Physician', phone: '+1 (555) 123-4567', email: 'sjohnson@clinic.com', availability: 'Available' },
      { id: 2, name: 'Nurse Michael Chen', role: 'Home Health Nurse', phone: '+1 (555) 234-5678', email: 'mchen@homehealth.com', availability: 'On Duty' },
      { id: 3, name: 'Lisa Martinez', role: 'Physical Therapist', phone: '+1 (555) 345-6789', email: 'lmartinez@therapy.com', availability: 'Available' },
      { id: 4, name: 'James Wilson', role: 'Caregiver', phone: '+1 (555) 456-7890', email: 'jwilson@care.com', availability: 'On Duty' }
    ]);

    // Mock health trends
    setHealthTrends([
      { metric: 'Blood Pressure', current: '125/75', trend: 'stable', change: '0%' },
      { metric: 'Blood Glucose', current: '105 mg/dL', trend: 'improving', change: '-8%' },
      { metric: 'Weight', current: '165 lbs', trend: 'stable', change: '+1%' },
      { metric: 'Heart Rate', current: '72 bpm', trend: 'stable', change: '0%' }
    ]);

    // Mock billing
    setBilling([
      { id: 1, description: 'Home Health Visit - January', amount: 450.00, date: '2024-01-15', status: 'Paid' },
      { id: 2, description: 'Physical Therapy Session', amount: 125.00, date: '2024-01-12', status: 'Paid' },
      { id: 3, description: 'Monthly Care Plan Fee', amount: 350.00, date: '2024-02-01', status: 'Pending' }
    ]);

    // Mock notifications
    setNotifications([
      { id: 1, text: 'Medication reminder: Lisinopril 10mg due at 8:00 AM', type: 'medication', time: '10 min ago' },
      { id: 2, text: 'Upcoming appointment with Dr. Johnson on Feb 5', type: 'appointment', time: '2 hours ago' },
      { id: 3, text: 'Weekly care report is now available', type: 'report', time: '1 day ago' }
    ]);
  };

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

  const renderContent = () => {
    switch (activeTab) {
      case 'messages':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-5 h-5" />
                <span>New Message</span>
              </button>
            </div>

            <div className="space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl p-6 shadow-sm border ${msg.unread ? 'border-blue-300' : 'border-gray-200'}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {msg.from.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900">{msg.from}</h3>
                        <span className="text-sm text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-gray-700">{msg.message}</p>
                      <div className="flex items-center space-x-4 mt-4">
                        <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm">Reply</span>
                        </button>
                        {msg.unread && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">New</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'carePlans':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Care Plans</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-5 h-5" />
                <span>New Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {carePlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{plan.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {plan.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{plan.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${plan.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Goals</p>
                        <p className="text-lg font-bold text-gray-900">{plan.completed}/{plan.goals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Next Review</p>
                        <p className="text-sm font-semibold text-gray-900">{plan.nextReview}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Updated {plan.lastUpdated}</span>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">View Details</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'careTeam':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Care Team</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-5 h-5" />
                <span>Add Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {careTeam.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <p className="text-xs text-gray-500 mt-1">{member.specialty}</p>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Phone className="w-4 h-4" />
                          <span>{member.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Mail className="w-4 h-4" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="w-4 h-4" />
                          <span className="text-gray-700">Next visit: <span className="font-semibold">{member.nextVisit}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${member.availability === 'Available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {member.availability}
                        </span>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">Contact</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'healthTrends':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Health Trends</h2>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">7 Days</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">30 Days</button>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">90 Days</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {healthTrends.map((trend, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-600">{trend.metric}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      trend.status === 'excellent' ? 'bg-green-100 text-green-700' :
                      trend.status === 'good' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {trend.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-3xl font-bold text-gray-900">{trend.current}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {trend.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {trend.trend === 'stable' && <div className="w-4 h-1 bg-gray-400 rounded"></div>}
                      <span className={`text-sm font-semibold ${trend.trend === 'improving' ? 'text-green-600' : 'text-gray-600'}`}>
                        {trend.change} from last week
                      </span>
                    </div>
                  </div>

                  <div className="h-20">
                    <div className="flex items-end justify-between h-full space-x-1">
                      {trend.history?.map((value, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-t"
                          style={{ height: `${(value / Math.max(...trend.history)) * 100}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-5 h-5" />
                  <span>Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Upload className="w-5 h-5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-700 mr-4">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          <Edit className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">${billing.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">${billing.filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{billing.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billing.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{transaction.description}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.invoice}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${transaction.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${transaction.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-700">View Invoice</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default: // overview
        return (
          <>
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
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Alerts</h2>
                {dashboardData?.alerts?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.alerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{alert.type}</p>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No active alerts</p>
                )}
              </motion.div>

              {/* Today's Medications */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Medications</h2>
                {dashboardData?.medications?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.medications.slice(0, 5).map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
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
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
                {dashboardData?.appointments?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.appointments.slice(0, 4).map((appt, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{appt.title}</p>
                          <p className="text-sm text-gray-600">{appt.provider}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(appt.startTime).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
                )}
              </motion.div>

              {/* Care Tasks */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Care Tasks</h2>
                {dashboardData?.tasks?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.tasks.slice(0, 4).map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.description}</p>
                          <p className="text-sm text-gray-600">{task.frequency}</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={task.status === 'COMPLETED'} readOnly />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No tasks for today</p>
                )}
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Quick Access</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => navigate('/monitoring/dashboard')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all">
                  <Activity className="w-8 h-8 mb-2 mx-auto" />
                  <p className="text-sm font-medium">Health Monitor</p>
                </button>
                <button onClick={() => navigate('/smart-home')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all">
                  <Shield className="w-8 h-8 mb-2 mx-auto" />
                  <p className="text-sm font-medium">Smart Home</p>
                </button>
                <button onClick={() => navigate('/booking')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all">
                  <Calendar className="w-8 h-8 mb-2 mx-auto" />
                  <p className="text-sm font-medium">Book Service</p>
                </button>
                <button onClick={() => navigate('/care-guide')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all">
                  <Heart className="w-8 h-8 mb-2 mx-auto" />
                  <p className="text-sm font-medium">Care Guide</p>
                </button>
              </div>
            </motion.div>
          </>
        );
    }
  };

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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <HomeIcon className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Overview</span>}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'messages' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <MessageSquare className="w-5 h-5" />
            {sidebarOpen && <span>Messages</span>}
            {messages.filter(m => m.unread).length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {messages.filter(m => m.unread).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('carePlans')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'carePlans' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Clipboard className="w-5 h-5" />
            {sidebarOpen && <span>Care Plans</span>}
          </button>
          <button
            onClick={() => setActiveTab('careTeam')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'careTeam' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Users className="w-5 h-5" />
            {sidebarOpen && <span>Care Team</span>}
          </button>
          <button
            onClick={() => setActiveTab('healthTrends')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'healthTrends' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <TrendingUp className="w-5 h-5" />
            {sidebarOpen && <span>Health Trends</span>}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'documents' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span>Documents</span>}
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeTab === 'billing' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <DollarSign className="w-5 h-5" />
            {sidebarOpen && <span>Billing</span>}
          </button>

          <div className="border-t border-gray-200 my-4"></div>

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
              <Stethoscope className="w-5 h-5" />
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600">
                Here's what's happening with your care recipients
              </p>
            </div>
            {notifications.length > 0 && (
              <button className="relative p-3 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            )}
          </div>

          {/* Dynamic Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
