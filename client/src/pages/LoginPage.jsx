import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, AlertCircle, LogIn, Home } from 'lucide-react';
import { useAuth } from '../shared/hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error, isLoading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const demoAccounts = [
    { role: 'Admin', email: 'admin@eldercare.com', password: 'admin123', color: 'purple', icon: '👨‍💼' },
    { role: 'Clinician', email: 'dr.smith@eldercare.com', password: 'doctor123', color: 'blue', icon: '👨‍⚕️' },
    { role: 'Family', email: 'family@example.com', password: 'family123', color: 'green', icon: '👨‍👩‍👧' },
    { role: 'Caregiver', email: 'caregiver@eldercare.com', password: 'care123', color: 'orange', icon: '🤝' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by useAuth hook
      console.error('Login error:', err);
    }
  };

  const handleQuickLogin = async (email, password) => {
    clearError();

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      console.error('Quick login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAydjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      {/* Back to Home */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white hover:bg-white/20 transition-colors"
      >
        <Home className="w-5 h-5" />
        <span>Back to Home</span>
      </button>

      <div className="max-w-6xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-6 border border-white/20">
            <LogIn className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome Back
          </h1>
          <p className="text-xl text-blue-200">
            Sign in to access your ElderCare Advanced account
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

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Create account
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
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
            <h2 className="text-2xl font-bold text-white mb-6">Quick Demo Login</h2>
            <p className="text-blue-200 mb-6">
              Try the system with pre-configured demo accounts
            </p>

            <div className="space-y-4">
              {demoAccounts.map((account, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleQuickLogin(account.email, account.password)}
                  disabled={isLoading}
                  className={`w-full p-4 bg-${account.color}-500/20 hover:bg-${account.color}-500/30 border border-${account.color}-500/50 rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-2xl">{account.icon}</span>
                        <span className="text-white font-semibold">{account.role}</span>
                      </div>
                      <div className="text-sm text-gray-300">{account.email}</div>
                    </div>
                    <LogIn className="w-6 h-6 text-white opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
              <p className="text-yellow-200 text-sm">
                <strong>Demo Mode:</strong> These accounts are for testing purposes. All demo accounts are pre-configured with sample data.
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
            <p className="text-blue-200 mb-2">
              <strong className="text-white">Unified Platform:</strong> Single sign-on for all ElderCare services
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-blue-300">
              <span>🏡 Smart Home</span>
              <span>•</span>
              <span>❤️ Health Monitoring</span>
              <span>•</span>
              <span>📊 Care Management</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
