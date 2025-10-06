import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Heart, Droplet, Thermometer, Wind, AlertTriangle,
  Bell, User, LogOut, RefreshCw, TrendingUp, TrendingDown,
  Camera, Phone, Clock, CheckCircle, XCircle, Shield,
  Brain, Footprints, Moon, Coffee, Battery, Wifi, Zap, Target, Gauge, Eye
} from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const MonitoringDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [latestVitals, setLatestVitals] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [vitalHistory, setVitalHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const API_URL = 'http://localhost:5001/api';
  const SOCKET_URL = 'http://localhost:5001';

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('monitoring_token');
    const userData = localStorage.getItem('monitoring_user');

    if (!token || !userData) {
      navigate('/monitoring/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Set axios default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Initialize WebSocket
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnectionStatus('connecting');
      newSocket.emit('authenticate', token);
    });

    newSocket.on('authenticated', (data) => {
      console.log('Authenticated:', data);
      setConnectionStatus('connected');
    });

    newSocket.on('vital-reading', (data) => {
      console.log('New vital reading:', data);
      if (selectedPatient && data.patientId === selectedPatient._id) {
        fetchLatestVitals(selectedPatient._id);
        fetchVitalHistory(selectedPatient._id);
      }
    });

    newSocket.on('new-alert', (data) => {
      console.log('New alert:', data);
      fetchAlerts();
    });

    newSocket.on('alert-acknowledged', () => {
      fetchAlerts();
    });

    newSocket.on('alert-resolved', () => {
      fetchAlerts();
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    setSocket(newSocket);

    // Fetch initial data
    fetchPatients();
    fetchAlerts();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedPatient && socket) {
      socket.emit('subscribe-patient', selectedPatient._id);
      fetchLatestVitals(selectedPatient._id);
      fetchVitalHistory(selectedPatient._id);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/patients`);
      setPatients(response.data.data);
      if (response.data.data.length > 0 && !selectedPatient) {
        setSelectedPatient(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestVitals = async (patientId) => {
    try {
      const response = await axios.get(`${API_URL}/vitals/patient/${patientId}/latest`);
      setLatestVitals(response.data.data);
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  };

  const fetchVitalHistory = async (patientId) => {
    try {
      const response = await axios.get(`${API_URL}/vitals/patient/${patientId}?type=blood-pressure&limit=20`);
      const formattedData = response.data.data.reverse().map((reading, index) => ({
        time: new Date(reading.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        systolic: reading.values.systolic,
        diastolic: reading.values.diastolic
      }));
      setVitalHistory(formattedData);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_URL}/alerts?limit=10`);
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.put(`${API_URL}/alerts/${alertId}/acknowledge`);
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('monitoring_token');
    localStorage.removeItem('monitoring_user');
    if (socket) socket.disconnect();
    navigate('/monitoring/login');
  };

  const getVitalStatus = (type, value) => {
    if (!value) return 'normal';

    switch(type) {
      case 'bp':
        if (value.systolic > 140 || value.diastolic > 90) return 'warning';
        if (value.systolic > 160 || value.diastolic > 100) return 'critical';
        return 'normal';
      case 'heartRate':
        if (value < 50 || value > 100) return 'warning';
        if (value < 40 || value > 120) return 'critical';
        return 'normal';
      case 'glucose':
        if (value < 70 || value > 180) return 'warning';
        if (value < 55 || value > 250) return 'critical';
        return 'normal';
      case 'temperature':
        if (value < 97 || value > 99.5) return 'warning';
        if (value < 95 || value > 103) return 'critical';
        return 'normal';
      case 'spo2':
        if (value < 90) return 'critical';
        if (value < 95) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const VitalCard = ({ icon: Icon, title, value, unit, status, trend }) => {
    const statusColors = {
      normal: 'from-green-500 to-emerald-600',
      warning: 'from-yellow-500 to-orange-600',
      critical: 'from-red-500 to-rose-600'
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br ${statusColors[status] || statusColors.normal} rounded-2xl p-6 text-white shadow-xl`}
      >
        <div className="flex items-start justify-between mb-4">
          <Icon className="w-10 h-10" />
          {trend && (
            <div className="flex items-center text-sm">
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          )}
        </div>
        <div className="text-4xl font-bold mb-1">{value || '--'}</div>
        <div className="text-sm opacity-90">{unit}</div>
        <div className="text-xs opacity-75 mt-2">{title}</div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading monitoring system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Health Monitoring</h1>
                <p className="text-sm text-gray-500">Welcome, {user?.firstName} {user?.lastName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
              </div>

              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold capitalize">
                {user?.role}
              </span>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Patients ({patients.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient._id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedPatient?._id === patient._id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-semibold">{patient.firstName} {patient.lastName}</div>
                    <div className="text-sm text-gray-500">{patient.medicalRecordNumber}</div>
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years old
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Alerts */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Active Alerts
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {alerts.filter(a => a.status === 'active').map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-4 rounded-xl border-l-4 ${
                      alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                      alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                      'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{alert.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{alert.message}</div>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {user?.permissions?.acknowledgeAlerts && (
                        <button
                          onClick={() => acknowledgeAlert(alert._id)}
                          className="ml-2 p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {alerts.filter(a => a.status === 'active').length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No active alerts</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Details & Vitals */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">MRN</div>
                      <div className="font-semibold">{selectedPatient.medicalRecordNumber}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Age</div>
                      <div className="font-semibold">
                        {new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Gender</div>
                      <div className="font-semibold capitalize">{selectedPatient.gender}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Status</div>
                      <div className="font-semibold capitalize text-green-600">{selectedPatient.status}</div>
                    </div>
                  </div>
                </div>

                {/* Live Vitals - Primary Metrics */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-500" />
                    Cardiovascular Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalCard
                      icon={Activity}
                      title="Blood Pressure"
                      value={latestVitals?.bloodPressure ?
                        `${latestVitals.bloodPressure.systolic}/${latestVitals.bloodPressure.diastolic}` : '--'}
                      unit="mmHg"
                      status={latestVitals?.bloodPressure ?
                        getVitalStatus('bp', latestVitals.bloodPressure) : 'normal'}
                    />
                    <VitalCard
                      icon={Heart}
                      title="Heart Rate"
                      value={latestVitals?.heartRate}
                      unit="bpm"
                      status={latestVitals?.heartRate ?
                        getVitalStatus('heartRate', latestVitals.heartRate) : 'normal'}
                    />
                    <VitalCard
                      icon={Target}
                      title="MAP"
                      value={latestVitals?.bloodPressure?.map}
                      unit="mmHg"
                      status="normal"
                    />
                    <VitalCard
                      icon={Zap}
                      title="HRV"
                      value={latestVitals?.heartRateVariability}
                      unit="ms"
                      status="normal"
                    />
                  </div>
                </div>

                {/* Respiratory Metrics */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Wind className="w-5 h-5 mr-2 text-blue-500" />
                    Respiratory Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalCard
                      icon={Wind}
                      title="SpO2"
                      value={latestVitals?.oxygenSaturation}
                      unit="%"
                      status={latestVitals?.oxygenSaturation ?
                        getVitalStatus('spo2', latestVitals.oxygenSaturation) : 'normal'}
                    />
                    <VitalCard
                      icon={Activity}
                      title="Respiratory Rate"
                      value={latestVitals?.respiratoryRate}
                      unit="bpm"
                      status="normal"
                    />
                    <VitalCard
                      icon={Gauge}
                      title="End-Tidal CO₂"
                      value={latestVitals?.endTidalCO2}
                      unit="mmHg"
                      status="normal"
                    />
                    <VitalCard
                      icon={Wind}
                      title="Peak Flow"
                      value={latestVitals?.peakExpiratoryFlow}
                      unit="L/min"
                      status="normal"
                    />
                  </div>
                </div>

                {/* Metabolic & Neurological */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Thermometer className="w-5 h-5 mr-2 text-orange-500" />
                    Metabolic & Neurological
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalCard
                      icon={Thermometer}
                      title="Temperature"
                      value={latestVitals?.temperature}
                      unit="°F"
                      status={latestVitals?.temperature ?
                        getVitalStatus('temperature', latestVitals.temperature) : 'normal'}
                    />
                    <VitalCard
                      icon={Droplet}
                      title="Blood Glucose"
                      value={latestVitals?.bloodGlucose}
                      unit="mg/dL"
                      status={latestVitals?.bloodGlucose ?
                        getVitalStatus('glucose', latestVitals.bloodGlucose) : 'normal'}
                    />
                    <VitalCard
                      icon={Activity}
                      title="Blood Lactate"
                      value={latestVitals?.bloodLactate}
                      unit="mmol/L"
                      status="normal"
                    />
                    <VitalCard
                      icon={Brain}
                      title="Consciousness"
                      value={latestVitals?.consciousnessLevel}
                      unit=""
                      status={latestVitals?.consciousnessLevel === 'Alert' ? 'normal' : 'warning'}
                    />
                  </div>
                </div>

                {/* Activity & Safety */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Footprints className="w-5 h-5 mr-2 text-green-500" />
                    Activity & Safety Monitoring
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalCard
                      icon={Footprints}
                      title="Steps (Last Hour)"
                      value={latestVitals?.steps}
                      unit="steps"
                      status="normal"
                    />
                    <VitalCard
                      icon={Activity}
                      title="Movement"
                      value={latestVitals?.movementDetected ? 'Active' : 'Resting'}
                      unit=""
                      status="normal"
                    />
                    <VitalCard
                      icon={AlertTriangle}
                      title="Fall Risk"
                      value={latestVitals?.fallRisk}
                      unit=""
                      status={latestVitals?.fallRisk === 'High' ? 'critical' :
                             latestVitals?.fallRisk === 'Medium' ? 'warning' : 'normal'}
                    />
                    <VitalCard
                      icon={Activity}
                      title="Position Changes"
                      value={latestVitals?.positionChanges}
                      unit="changes"
                      status="normal"
                    />
                  </div>
                </div>

                {/* Sleep & Wellness */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Moon className="w-5 h-5 mr-2 text-indigo-500" />
                    Sleep & Wellness
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalCard
                      icon={Moon}
                      title="Sleep Quality"
                      value={latestVitals?.sleepQuality}
                      unit=""
                      status="normal"
                    />
                    <VitalCard
                      icon={Coffee}
                      title="Fluid Intake"
                      value={latestVitals?.fluidIntake}
                      unit="mL/hr"
                      status="normal"
                    />
                    <VitalCard
                      icon={Droplet}
                      title="Nutrition Score"
                      value={latestVitals?.nutritionScore}
                      unit="%"
                      status="normal"
                    />
                    <VitalCard
                      icon={Eye}
                      title="Pain Level"
                      value={latestVitals?.painLevel}
                      unit="/10"
                      status={latestVitals?.painLevel > 5 ? 'warning' : 'normal'}
                    />
                  </div>
                </div>

                {/* Device & Environmental */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Battery className="w-5 h-5 mr-2 text-yellow-500" />
                    Device & Environment Status
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalCard
                      icon={Battery}
                      title="Device Battery"
                      value={latestVitals?.deviceBattery}
                      unit="%"
                      status={latestVitals?.deviceBattery < 20 ? 'warning' : 'normal'}
                    />
                    <VitalCard
                      icon={Wifi}
                      title="Signal Strength"
                      value={latestVitals?.signalStrength}
                      unit="/5"
                      status="normal"
                    />
                    <VitalCard
                      icon={Thermometer}
                      title="Room Temp"
                      value={latestVitals?.roomTemperature}
                      unit="°F"
                      status="normal"
                    />
                    <VitalCard
                      icon={Droplet}
                      title="Room Humidity"
                      value={latestVitals?.roomHumidity}
                      unit="%"
                      status="normal"
                    />
                  </div>
                </div>

                {/* BP Trend Chart */}
                {vitalHistory.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Blood Pressure Trend (Last 24 Hours)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={vitalHistory}>
                        <defs>
                          <linearGradient id="colorSystolic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDiastolic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="systolic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSystolic)" />
                        <Area type="monotone" dataKey="diastolic" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDiastolic)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Select a patient to view vitals</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
