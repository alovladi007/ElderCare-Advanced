import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplet, CheckCircle, Clock, Shield, Phone, ArrowRight, Wrench } from 'lucide-react';

const PlumbingServicesPage = () => {
  const services = [
    {
      title: 'Faucet Services',
      items: ['Faucet repair', 'Faucet replacement', 'Leak fixes', 'Dripping faucet repair', 'Water pressure adjustment']
    },
    {
      title: 'Pipe Repairs',
      items: ['Pipe leak repair', 'Pipe replacement', 'Frozen pipe repair', 'Pipe insulation', 'Re-piping services']
    },
    {
      title: 'Toilet Repairs',
      items: ['Running toilet fix', 'Toilet replacement', 'Flush mechanism repair', 'Wax ring replacement', 'Toilet installation']
    },
    {
      title: 'Leak Prevention',
      items: ['Leak detection', 'Water line inspection', 'Preventive maintenance', 'Sump pump service', 'Drain cleaning']
    }
  ];

  const benefits = [
    { icon: <Clock className="w-6 h-6" />, title: 'Fast Response', description: 'Quick service for plumbing emergencies' },
    { icon: <Shield className="w-6 h-6" />, title: 'Licensed Plumbers', description: 'Experienced and certified professionals' },
    { icon: <Wrench className="w-6 h-6" />, title: 'Quality Parts', description: 'We use only quality fixtures and materials' },
    { icon: <CheckCircle className="w-6 h-6" />, title: 'Guaranteed', description: 'All plumbing work is guaranteed' }
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
            <Droplet className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Plumbing Services</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Expert plumbing repairs including faucets, pipes, toilets, and leak prevention
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">
                Schedule Plumber
              </Link>
              <a href="tel:+1234567890" className="btn-secondary">
                <Phone className="w-5 h-5 mr-2" />
                Emergency Call
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Plumbing Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional plumbing services for all your home's needs
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

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-12">Why Choose Our Plumbing Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Notice */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-2">24/7 Emergency Plumbing Service</h3>
          <p className="text-blue-100 mb-4">Burst pipes, major leaks, or flooding? We're available anytime</p>
          <a href="tel:+1234567890" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100 inline-flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Call Emergency Line
          </a>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="neural-bg rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Plumbing Repairs?</h2>
            <p className="text-xl mb-8 text-blue-100">Expert plumbers ready to solve your plumbing issues</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Book a Plumber
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

export default PlumbingServicesPage;
