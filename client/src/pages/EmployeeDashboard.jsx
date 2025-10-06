import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Clock, LogOut, FileText, Calendar, User, CheckCircle,
  ClipboardList, AlertCircle, TrendingUp, PlayCircle, StopCircle
} from 'lucide-react';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workDuration, setWorkDuration] = useState(0);
  const [clockInTime, setClockInTime] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check authentication
    const auth = localStorage.getItem('employeeAuth');
    if (!auth) {
      navigate('/employee-login');
      return;
    }
    setEmployee(JSON.parse(auth));

    // Check if already clocked in
    const clockData = localStorage.getItem('clockData');
    if (clockData) {
      const data = JSON.parse(clockData);
      setIsClockedIn(data.isClockedIn);
      setClockInTime(data.clockInTime ? new Date(data.clockInTime) : null);
    }

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    if (isClockedIn && clockInTime) {
      const duration = Math.floor((currentTime - clockInTime) / 1000);
      setWorkDuration(duration);
    }
  }, [currentTime, isClockedIn, clockInTime]);

  const handleClockIn = () => {
    const time = new Date();
    setIsClockedIn(true);
    setClockInTime(time);
    localStorage.setItem('clockData', JSON.stringify({
      isClockedIn: true,
      clockInTime: time.toISOString()
    }));
    toast.success(`Clocked in at ${time.toLocaleTimeString()}`);
  };

  const handleClockOut = () => {
    const duration = formatDuration(workDuration);
    setIsClockedIn(false);
    setClockInTime(null);
    setWorkDuration(0);
    localStorage.setItem('clockData', JSON.stringify({
      isClockedIn: false,
      clockInTime: null
    }));
    toast.success(`Clocked out! Work duration: ${duration}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeAuth');
    localStorage.removeItem('clockData');
    toast.info('Logged out successfully');
    navigate('/employee-login');
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {employee?.name}!</h2>
        <p className="text-gray-600">Today is {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className="text-3xl font-bold text-blue-600 mt-2">{currentTime.toLocaleTimeString()}</p>
      </div>

      {/* Clock In/Out Section */}
      <div className="card p-8 text-center">
        <Clock className="w-16 h-16 mx-auto mb-4 text-blue-600" />
        <h3 className="text-2xl font-bold mb-4">Time Clock</h3>

        {isClockedIn ? (
          <div>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">Clocked in at</p>
              <p className="text-2xl font-bold text-green-600">{clockInTime?.toLocaleTimeString()}</p>
              <p className="text-gray-600 mt-4">Working for</p>
              <p className="text-4xl font-bold text-blue-600">{formatDuration(workDuration)}</p>
            </div>
            <button
              onClick={handleClockOut}
              className="px-8 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center mx-auto"
            >
              <StopCircle className="mr-2" size={24} />
              Clock Out
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-6">Ready to start your shift?</p>
            <button
              onClick={handleClockIn}
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center mx-auto"
            >
              <PlayCircle className="mr-2" size={24} />
              Clock In
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <Calendar className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">This Week</p>
          <p className="text-3xl font-bold">32h</p>
        </div>
        <div className="card p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <p className="text-gray-600">Tasks Completed</p>
          <p className="text-3xl font-bold">47</p>
        </div>
        <div className="card p-6 text-center">
          <TrendingUp className="w-10 h-10 text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">Performance</p>
          <p className="text-3xl font-bold">98%</p>
        </div>
      </div>
    </div>
  );

  const FormsTab = () => {
    const [selectedForm, setSelectedForm] = useState(null);
    const [formData, setFormData] = useState({});

    const forms = [
      { id: 1, name: 'Daily Care Report', icon: <ClipboardList />, color: 'blue' },
      { id: 2, name: 'Incident Report', icon: <AlertCircle />, color: 'red' },
      { id: 3, name: 'Medication Log', icon: <FileText />, color: 'green' },
      { id: 4, name: 'Patient Visit Notes', icon: <User />, color: 'purple' }
    ];

    const handleFormSubmit = (e) => {
      e.preventDefault();
      toast.success('Form submitted successfully!');
      setSelectedForm(null);
      setFormData({});
    };

    if (selectedForm) {
      return (
        <div className="card p-8">
          <button
            onClick={() => setSelectedForm(null)}
            className="mb-6 text-blue-600 hover:underline"
          >
            ← Back to Forms
          </button>
          <h3 className="text-2xl font-bold mb-6">{selectedForm.name}</h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Patient/Client Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Date & Time</label>
              <input
                type="datetime-local"
                required
                defaultValue={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                rows="6"
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter details..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Additional Notes</label>
              <textarea
                rows="4"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional additional information..."
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Submit Form
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-4">Available Forms</h3>
          <p className="text-gray-600">Select a form to fill out</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              onClick={() => setSelectedForm(form)}
              className="card p-6 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className={`w-12 h-12 bg-${form.color}-100 rounded-lg flex items-center justify-center text-${form.color}-600 mb-4`}>
                {form.icon}
              </div>
              <h4 className="text-xl font-bold mb-2">{form.name}</h4>
              <p className="text-gray-600 text-sm">Click to fill out this form</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Employee Dashboard</h1>
              <p className="text-blue-100">ElderCare & HomeCare Services</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold">{employee.name}</p>
                <p className="text-sm text-blue-100">{employee.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'forms'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              Forms
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'forms' && <FormsTab />}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
