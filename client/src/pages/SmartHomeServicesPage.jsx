import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Shield, Lightbulb, Thermometer, Mic, AlertTriangle, ArrowRight, CheckCircle, Lock, Video, Smartphone, Wifi } from 'lucide-react';

const SmartHomeServicesPage = () => {
  const services = [
    {
      icon: <Shield />,
      title: 'Smart Security & Monitoring',
      description: 'Advanced security cameras, smart locks, and 24/7 monitoring for complete home protection',
      features: ['HD Security Cameras', 'Smart Door Locks', 'Motion Sensors', 'Window/Door Sensors'],
      link: '/smart-security'
    },
    {
      icon: <Lightbulb />,
      title: 'Automated Lighting',
      description: 'Voice-activated and scheduled lighting control for safety and energy efficiency',
      features: ['Motion-Activated Lights', 'Voice Control', 'Scheduled Automation', 'Energy Monitoring'],
      link: '/smart-lighting'
    },
    {
      icon: <Thermometer />,
      title: 'Climate Control',
      description: 'Smart thermostats and HVAC control for optimal comfort and energy savings',
      features: ['Smart Thermostats', 'Remote Control', 'Energy Reports', 'Auto-Scheduling'],
      link: '/climate-control'
    },
    {
      icon: <AlertTriangle />,
      title: 'Safety Sensors',
      description: 'Fall detection, water leak sensors, and emergency monitoring systems',
      features: ['Fall Detection', 'Water Leak Sensors', 'Smoke/CO Detectors', 'Medical Alerts'],
      link: '/safety-sensors'
    },
    {
      icon: <Mic />,
      title: 'Voice Assistants',
      description: 'Integration with Alexa, Google Home, and Siri for hands-free home control',
      features: ['Multi-Platform Support', 'Custom Voice Commands', 'Medication Reminders', 'Entertainment Control'],
      link: '/voice-assistants'
    },
    {
      icon: <Video />,
      title: 'Emergency Systems',
      description: 'Video intercoms, emergency call buttons, and instant family notifications',
      features: ['Video Doorbell', 'Emergency Buttons', 'Family Alerts', '24/7 Monitoring'],
      link: '/emergency-systems'
    }
  ];

  const monitoringFeatures = [
    {
      icon: <Smartphone />,
      title: 'Mobile App Control',
      description: 'Control your entire smart home from anywhere using your smartphone or tablet'
    },
    {
      icon: <Wifi />,
      title: 'Network Security',
      description: 'Enterprise-grade network security to protect your smart home devices'
    },
    {
      icon: <Lock />,
      title: 'Privacy Protection',
      description: 'All data encrypted and stored securely with full privacy controls'
    },
    {
      icon: <AlertTriangle />,
      title: 'Instant Alerts',
      description: 'Get immediate notifications for any security events or emergencies'
    }
  ];

  const emergencyServices = [
    'Fall Detection & Response',
    'Medical Emergency Alerts',
    'Fire & Carbon Monoxide Detection',
    'Water Leak Detection',
    'Power Outage Notifications',
    'Intrusion Alerts'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="neural-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Home className="w-5 h-5 mr-2" />
              <span className="font-semibold">Smart Home Technology</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Smart Home Control Center</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Transform your home into a safe, connected, and intelligent environment with our comprehensive smart home solutions designed specifically for elder care and independent living.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/smart-home-dashboard" className="btn-primary bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 inline-flex items-center">
                <Home className="mr-2" size={20} />
                Launch Dashboard
              </Link>
              <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100 inline-flex items-center">
                Get Started <ArrowRight className="inline ml-2" size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">Smart Home Solutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-8 hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                  {React.cloneElement(service.icon, { className: 'w-10 h-10' })}
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to={service.link} className="text-orange-600 font-semibold flex items-center hover:underline">
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 24/7 Monitoring Features */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">24/7 Smart Monitoring</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced monitoring and control systems that work around the clock to keep your loved ones safe and comfortable
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {monitoringFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                  {React.cloneElement(feature.icon, { className: 'w-8 h-8' })}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Response Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <AlertTriangle className="w-16 h-16 text-orange-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">Emergency Detection & Response</h2>
            <p className="text-xl text-gray-600 mb-8">
              Our smart home systems automatically detect emergencies and notify family members and emergency services instantly
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {emergencyServices.map((service, i) => (
                <div key={i} className="flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <CheckCircle className="w-5 h-5 text-orange-600 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium">{service}</span>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-2">24/7 Professional Monitoring Available</h3>
              <p className="text-gray-700 mb-4">
                Connect your smart home to our professional monitoring center for instant emergency response
              </p>
              <a href="tel:+1234567890" className="btn-primary inline-block">
                Contact Monitoring Center: (123) 456-7890
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Smart Home Technology?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mr-4 flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Enhanced Safety</h3>
                  <p className="text-gray-600">Automatic fall detection, emergency alerts, and 24/7 monitoring keep loved ones safe</p>
                </div>
              </div>
              <div className="flex">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white mr-4 flex-shrink-0">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Independent Living</h3>
                  <p className="text-gray-600">Voice control and automation help seniors maintain independence at home</p>
                </div>
              </div>
              <div className="flex">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white mr-4 flex-shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Peace of Mind</h3>
                  <p className="text-gray-600">Family members can monitor and check in remotely from anywhere</p>
                </div>
              </div>
              <div className="flex">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white mr-4 flex-shrink-0">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Energy Savings</h3>
                  <p className="text-gray-600">Smart automation reduces energy costs and optimizes home comfort</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 neural-bg text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Make Your Home Smarter & Safer?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get a free consultation and custom smart home assessment today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Schedule Free Consultation
            </Link>
            <Link to="/contact" className="btn-secondary bg-white/20 backdrop-blur-sm border-white text-white hover:bg-white/30">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SmartHomeServicesPage;
