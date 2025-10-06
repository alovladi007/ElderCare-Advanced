import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Shield, Eye, Phone, ArrowRight, Bell } from 'lucide-react';

const SecurityUpgradesPage = () => {
  const services = [
    {
      title: 'Lock Services',
      items: ['Deadbolt installation', 'Smart lock setup', 'Lock replacement', 'Rekeying service', 'High-security locks']
    },
    {
      title: 'Security Systems',
      items: ['Camera installation', 'Video doorbells', 'Motion sensors', 'Alarm systems', 'Smart home integration']
    },
    {
      title: 'Home Safety',
      items: ['Window locks', 'Door reinforcement', 'Outdoor lighting', 'Peephole installation', 'Security film']
    },
    {
      title: 'Monitoring & Alerts',
      items: ['24/7 monitoring setup', 'Mobile alerts', 'Emergency contacts', 'Medical alert systems', 'Fire & CO2 detectors']
    }
  ];

  const features = [
    { icon: <Lock className="w-6 h-6" />, title: 'Advanced Locks', description: 'Modern locking systems for security' },
    { icon: <Eye className="w-6 h-6" />, title: 'Video Surveillance', description: 'Monitor your home from anywhere' },
    { icon: <Bell className="w-6 h-6" />, title: 'Smart Alerts', description: 'Instant notifications on your phone' },
    { icon: <Shield className="w-6 h-6" />, title: 'Peace of Mind', description: 'Know your home is protected' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="neural-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Lock className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Security Upgrades</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Professional lock installation, security system setup, and comprehensive home safety solutions
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">
                Schedule Security Assessment
              </Link>
              <a href="tel:+1234567890" className="btn-secondary">
                <Phone className="w-5 h-5 mr-2" />
                Call for Consultation
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Comprehensive Security Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Protect your home and loved ones with our professional security services
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <h3 className="text-2xl font-bold mb-4 text-gray-800">{service.title}</h3>
                <ul className="space-y-2">
                  {service.items.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-12">Security Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Security Matters */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title text-center mb-12">Why Home Security Matters</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">For Seniors</h3>
                <p className="text-gray-600">
                  Enhanced security systems provide peace of mind for seniors living independently.
                  Smart locks eliminate the need for fumbling with keys, while video doorbells allow
                  safe visitor verification without opening the door.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">For Families</h3>
                <p className="text-gray-600">
                  Remote monitoring lets family members check on elderly loved ones from anywhere.
                  Medical alert systems and emergency response integration ensure help is always
                  just a button press away.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="neural-bg rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Upgrade Your Home Security</h2>
            <p className="text-xl mb-8 text-blue-100">Get a free security assessment and custom recommendations</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Schedule Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/repair-services" className="btn-secondary border-2 border-white hover:bg-white/10">
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SecurityUpgradesPage;
