import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Home, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BookingPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);

  const serviceTypes = [
    'Elder Care - Personal Care',
    'Elder Care - Memory Care',
    'Elder Care - 24/7 Care',
    'Home Care - Companionship',
    'Home Care - Meal Preparation',
    'Home Care - Light Housekeeping',
    'Repairs - General Handyman',
    'Repairs - Plumbing',
    'Repairs - Electrical',
    'Repairs - Safety Modifications',
    'Repairs - Emergency Service'
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Booking data:', data);
      toast.success('Booking request submitted successfully! We\'ll contact you shortly.');
      reset();
    } catch (error) {
      toast.error('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Schedule a Service
            </h1>
            <p className="text-xl text-gray-600">Fill out the form below and we'll get back to you within 24 hours</p>
          </div>

          <div className="card p-8 md:p-12">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" /> Full Name *
                  </label>
                  <input
                    {...register('fullName', { required: 'Full name is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="inline w-4 h-4 mr-1" /> Email Address *
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="inline w-4 h-4 mr-1" /> Phone Number *
                  </label>
                  <input
                    {...register('phone', { required: 'Phone number is required' })}
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(123) 456-7890"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Home className="inline w-4 h-4 mr-1" /> Service Type *
                  </label>
                  <select
                    {...register('serviceType', { required: 'Please select a service type' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a service...</option>
                    {serviceTypes.map((service, i) => (
                      <option key={i} value={service}>{service}</option>
                    ))}
                  </select>
                  {errors.serviceType && <p className="text-red-500 text-sm mt-1">{errors.serviceType.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" /> Preferred Date *
                  </label>
                  <input
                    {...register('preferredDate', { required: 'Please select a date' })}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.preferredDate && <p className="text-red-500 text-sm mt-1">{errors.preferredDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" /> Preferred Time *
                  </label>
                  <select
                    {...register('preferredTime', { required: 'Please select a time' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select time...</option>
                    <option value="morning">Morning (8am - 12pm)</option>
                    <option value="afternoon">Afternoon (12pm - 5pm)</option>
                    <option value="evening">Evening (5pm - 8pm)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                  {errors.preferredTime && <p className="text-red-500 text-sm mt-1">{errors.preferredTime.message}</p>}
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MessageSquare className="inline w-4 h-4 mr-1" /> Additional Information
                </label>
                <textarea
                  {...register('message')}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide any additional details about your needs..."
                />
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="inline mr-2" size={20} />
                      Submit Booking Request
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-4">We'll contact you within 24 hours to confirm your appointment</p>
              </div>
            </form>
          </div>

          {/* Contact Information */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <Phone className="w-10 h-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-2">Call Us</h3>
              <p className="text-gray-600">(123) 456-7890</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <Mail className="w-10 h-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-2">Email Us</h3>
              <p className="text-gray-600">info@eldercare.com</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <Clock className="w-10 h-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-2">Business Hours</h3>
              <p className="text-gray-600">24/7 Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
