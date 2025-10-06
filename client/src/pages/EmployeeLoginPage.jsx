import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Lock, User, Eye, EyeOff, Briefcase, ArrowLeft } from 'lucide-react';

const EmployeeLoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store employee session
      localStorage.setItem('employeeAuth', JSON.stringify({
        email: data.email,
        name: data.email.split('@')[0],
        role: 'employee',
        loginTime: new Date().toISOString()
      }));

      toast.success('Welcome back! Logged in successfully');
      navigate('/employee-dashboard');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Back to Main Site */}
        <Link
          to="/"
          className="inline-flex items-center text-white hover:text-blue-200 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Main Site
        </Link>

        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Briefcase className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Employee Portal</h1>
          <p className="text-blue-100">Evergreen Home & Care Services</p>
        </div>

        {/* Login Form */}
        <div className="glass-morphism p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <User className="inline w-4 h-4 mr-1" /> Employee Email
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                })}
                type="email"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white placeholder-white/60"
                placeholder="employee@eldercare.com"
              />
              {errors.email && <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <Lock className="inline w-4 h-4 mr-1" /> Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-white placeholder-white/60"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-300 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-white">
                <input type="checkbox" className="mr-2 rounded" />
                <span className="text-sm">Remember me</span>
              </label>
              <a href="#" className="text-sm text-white hover:underline">Forgot password?</a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-white/10 rounded-lg">
            <p className="text-xs text-white/80 text-center">
              <strong>Demo:</strong> employee@eldercare.com / password123
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-blue-200 text-sm"
          >
            ← Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLoginPage;
