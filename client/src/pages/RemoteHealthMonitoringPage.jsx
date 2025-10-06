import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, HeartPulse, Thermometer, Droplet, Scale, Phone,
  AlertCircle, Camera, Waves, Bell, Shield, Clock,
  ArrowRight, CheckCircle2, Smartphone, Monitor, Wifi,
  Siren, Zap, Eye, Radio, Star
} from 'lucide-react';

const RemoteHealthMonitoringPage = () => {
  const monitoringDevices = [
    {
      icon: <HeartPulse className="w-8 h-8" />,
      title: 'Blood Pressure Monitoring',
      description: 'Continuous BP tracking with automatic alerts',
      features: [
        'Automatic BP measurements every 30 minutes',
        'Instant alerts for abnormal readings',
        'Historical data tracking and trends',
        'Direct physician notification system',
        'Emergency response integration'
      ],
      gradient: 'from-red-500 to-rose-600',
      badge: 'FDA Approved'
    },
    {
      icon: <Droplet className="w-8 h-8" />,
      title: 'Blood Sugar Monitoring',
      description: 'Real-time glucose level tracking',
      features: [
        'Continuous glucose monitoring (CGM)',
        'Pre and post-meal alerts',
        'Hypo/hyperglycemia warnings',
        'Insulin dosage reminders',
        'Diabetologist instant access'
      ],
      gradient: 'from-blue-500 to-cyan-600',
      badge: 'Real-Time'
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Heart Rate & ECG',
      description: 'Advanced cardiac monitoring system',
      features: [
        '24/7 ECG monitoring',
        'Arrhythmia detection',
        'Heart rate variability analysis',
        'Atrial fibrillation alerts',
        'Cardiologist remote consultation'
      ],
      gradient: 'from-purple-500 to-indigo-600',
      badge: 'Medical Grade'
    },
    {
      icon: <Thermometer className="w-8 h-8" />,
      title: 'Temperature & Vitals',
      description: 'Complete vital signs monitoring',
      features: [
        'Body temperature tracking',
        'Oxygen saturation (SpO2) monitoring',
        'Respiratory rate detection',
        'Fever and hypothermia alerts',
        'Multi-parameter dashboard'
      ],
      gradient: 'from-orange-500 to-amber-600',
      badge: 'Comprehensive'
    }
  ];

  const smartSensors = [
    {
      icon: <Camera className="w-7 h-7" />,
      title: 'AI Video Monitoring',
      description: 'Privacy-focused intelligent surveillance',
      features: [
        'Fall detection with instant alerts',
        'Wandering and exit monitoring',
        'Activity pattern recognition',
        'Privacy blur technology',
        '24/7 recording with secure storage'
      ]
    },
    {
      icon: <Waves className="w-7 h-7" />,
      title: 'Motion Sensors',
      description: 'Advanced movement tracking',
      features: [
        'Room-by-room activity tracking',
        'Bed exit sensors',
        'Bathroom visit monitoring',
        'Unusual inactivity alerts',
        'Night-time movement detection'
      ]
    },
    {
      icon: <Bell className="w-7 h-7" />,
      title: 'Emergency Alert System',
      description: 'Instant emergency response',
      features: [
        'Wearable panic buttons',
        'Voice-activated SOS',
        'Automatic fall detection',
        'GPS location tracking',
        'Two-way communication'
      ]
    },
    {
      icon: <Smartphone className="w-7 h-7" />,
      title: 'Smart Home Integration',
      description: 'Connected care ecosystem',
      features: [
        'Smart medication dispensers',
        'Door/window sensors',
        'Refrigerator monitoring',
        'Stove safety shutoff',
        'Environmental sensors (smoke, CO)'
      ]
    }
  ];

  const responseTeam = [
    {
      icon: <Shield className="w-12 h-12" />,
      title: 'Medical Team',
      members: 'Doctors & Nurses',
      response: 'Instant Access',
      description: 'Direct line to medical professionals 24/7'
    },
    {
      icon: <Siren className="w-12 h-12" />,
      title: 'Emergency Services',
      members: 'Ambulance & Paramedics',
      response: '< 5 Minutes',
      description: 'Pre-authorized emergency dispatch system'
    },
    {
      icon: <Phone className="w-12 h-12" />,
      title: 'Family Alerts',
      members: 'Loved Ones',
      response: 'Real-Time',
      description: 'Instant notifications to family members'
    }
  ];

  const stats = [
    { number: '99.9%', label: 'System Uptime', icon: <Wifi className="w-6 h-6" /> },
    { number: '<30s', label: 'Alert Response', icon: <Zap className="w-6 h-6" /> },
    { number: '24/7', label: 'Monitoring', icon: <Eye className="w-6 h-6" /> },
    { number: '100%', label: 'HIPAA Compliant', icon: <Shield className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAydjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl mb-8 border border-white/20"
            >
              <Monitor className="w-14 h-14" />
            </motion.div>

            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-6">
              Advanced Health Technology
            </span>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Remote Health Monitoring
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-10 leading-relaxed max-w-4xl mx-auto">
              AI-powered medical devices, sensors, and cameras monitoring patient health 24/7 with instant alerts to doctors, ambulances, and family
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-16">
              <Link to="/booking" className="group px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-xl flex items-center">
                Get Monitoring System
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="tel:+1234567890" className="px-8 py-4 border-2 border-white/30 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Emergency: 911
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex justify-center mb-3 text-purple-200">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-purple-100 text-sm md:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </section>

      {/* Medical Devices Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold mb-4">
              Medical-Grade Devices
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Health Monitoring Devices</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              FDA-approved medical devices providing continuous health monitoring with automatic alerts
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {monitoringDevices.map((device, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${device.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${device.gradient} text-white rounded-2xl transform group-hover:scale-110 transition-transform duration-300`}>
                      {device.icon}
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {device.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-gray-800">{device.title}</h3>
                  <p className="text-gray-500 mb-6">{device.description}</p>

                  <ul className="space-y-3">
                    {device.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start group/item">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Sensors Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-4">
              AI-Powered Sensors
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Smart Monitoring Systems</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced sensors and cameras tracking patient movements and activities with AI-powered fall detection
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {smartSensors.map((sensor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-gray-200"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {sensor.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{sensor.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{sensor.description}</p>
                <ul className="space-y-2">
                  {sensor.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Response Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-red-100 text-red-600 rounded-full text-sm font-semibold mb-4">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Emergency Response
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Instant Alert System</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Automatic alerts triggered to medical professionals, emergency services, and family members
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {responseTeam.map((team, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-full mb-6">
                  {team.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{team.title}</h3>
                <p className="text-gray-600 mb-2">{team.members}</p>
                <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold mb-4">
                  {team.response}
                </div>
                <p className="text-gray-500 text-sm">{team.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold mb-4">
              Simple Setup
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
          </motion.div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Installation', desc: 'Professional setup of all devices and sensors in your home', icon: <Radio className="w-8 h-8" /> },
              { step: '02', title: 'Configuration', desc: 'Customize alerts and connect with your medical team', icon: <Activity className="w-8 h-8" /> },
              { step: '03', title: 'Monitoring', desc: '24/7 automated health tracking and movement monitoring', icon: <Clock className="w-8 h-8" /> },
              { step: '04', title: 'Response', desc: 'Instant alerts and emergency dispatch when needed', icon: <Bell className="w-8 h-8" /> }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl mb-4">
                  {item.icon}
                </div>
                <div className="text-5xl font-bold text-indigo-100 mb-3">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-indigo-200"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 rounded-3xl p-12 md:p-16 text-center text-white overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAydjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <Star className="w-12 h-12 mx-auto mb-6 fill-yellow-300 text-yellow-300" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Advanced Care Technology</h2>
              <p className="text-xl md:text-2xl mb-10 text-purple-100 leading-relaxed">
                Protect your loved ones with cutting-edge health monitoring technology. Peace of mind with 24/7 automated alerts.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/monitoring/login" className="group px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-xl inline-flex items-center">
                  Access Monitoring Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/booking" className="px-8 py-4 border-2 border-white/30 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/10 transition-all inline-flex items-center">
                  Schedule Installation
                </Link>
                <Link to="/elder-care" className="px-8 py-4 border-2 border-white/30 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/10 transition-all inline-flex items-center">
                  View All Elder Care Services
                </Link>
              </div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default RemoteHealthMonitoringPage;
