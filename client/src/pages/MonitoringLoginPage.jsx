import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Monitor, Lock, User, AlertCircle, Activity } from 'lucide-react';
import axios from 'axios';

const MonitoringLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const quickLogins = [
    { role: 'Doctor', email: 'doctor@evergreen.com', password: 'password123', color: 'blue' },
    { role: 'Nurse', email: 'nurse@evergreen.com', password: 'password123', color: 'green' },
    { role: 'Family', email: 'john.smith@email.com', password: 'password123', color: 'purple' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', formData);

      // Store auth data
      localStorage.setItem('monitoring_token', response.data.data.token);
      localStorage.setItem('monitoring_user', JSON.stringify(response.data.data));

      // Redirect to dashboard
      navigate('/monitoring/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setFormData({ email, password });
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', { email, password });

      localStorage.setItem('monitoring_token', response.data.data.token);
      localStorage.setItem('monitoring_user', JSON.stringify(response.data.data));

      navigate('/monitoring/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAydjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      <div className="max-w-6xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-6 border border-white/20">
            <Monitor className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Health Monitoring System
          </h1>
          <p className="text-xl text-blue-200">
            Real-time patient health tracking for doctors and families
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start">
                <AlertCircle className="w-5 h-5 text-red-300 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white mb-2 font-medium">Email</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white mb-2 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </motion.div>

          {/* Quick Login */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Quick Test Login</h2>
            <p className="text-blue-200 mb-6">
              Try the system with pre-configured test accounts
            </p>

            <div className="space-y-4">
              {quickLogins.map((account, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleQuickLogin(account.email, account.password)}
                  disabled={loading}
                  className={`w-full p-4 bg-${account.color}-500/20 hover:bg-${account.color}-500/30 border border-${account.color}-500/50 rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold mb-1">{account.role} Account</div>
                      <div className="text-sm text-gray-300">{account.email}</div>
                    </div>
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
              <p className="text-yellow-200 text-sm">
                <strong>Note:</strong> All test accounts use password: <code className="bg-black/30 px-2 py-1 rounded">password123</code>
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 inline-block">
            <p className="text-blue-200 mb-4">
              <strong className="text-white">Important:</strong> Make sure the monitoring backend is running:
            </p>
            <code className="block bg-black/30 text-green-400 px-4 py-2 rounded-lg text-sm">
              cd monitoring-backend && npm run dev
            </code>
            <p className="text-blue-200 text-sm mt-2">
              Backend should be running on http://localhost:5001
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MonitoringLoginPage;
