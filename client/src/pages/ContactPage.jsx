import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

const ContactPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Contact data:', data);
      toast.success('Message sent successfully! We\'ll respond within 24 hours.');
      reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Get In Touch
            </h1>
            <p className="text-xl text-gray-600">We're here to answer your questions and discuss your needs</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    {...register('email', { required: 'Email is required', pattern: /^\S+@\S+$/i })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                  <textarea
                    {...register('message', { required: 'Message is required' })}
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  <Send className="inline mr-2" size={20} />
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="card p-8">
                <Phone className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Call Us</h3>
                <p className="text-gray-600 mb-2">Available 24/7 for emergencies</p>
                <a href="tel:+1234567890" className="text-2xl font-bold text-blue-600">(123) 456-7890</a>
              </div>
              <div className="card p-8">
                <Mail className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Email Us</h3>
                <a href="mailto:info@eldercare.com" className="text-lg text-blue-600">info@eldercare.com</a>
              </div>
              <div className="card p-8">
                <MapPin className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                <p className="text-gray-600">123 Care Street<br/>New York, NY 10001</p>
              </div>
              <div className="card p-8">
                <Clock className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Business Hours</h3>
                <p className="text-gray-600">Monday - Friday: 8am - 6pm<br/>Saturday - Sunday: 24/7 Emergency</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
