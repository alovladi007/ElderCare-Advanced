import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, Shield, AlertTriangle, Phone, ArrowRight } from 'lucide-react';

const ElectricalWorkPage = () => {
  const services = [
    {
      title: 'Light Fixture Installation',
      items: ['Ceiling lights', 'Chandeliers', 'Recessed lighting', 'Track lighting', 'Outdoor lights']
    },
    {
      title: 'Outlets & Switches',
      items: ['Outlet installation', 'GFCI outlets', 'USB outlets', 'Switch replacement', 'Dimmer switches']
    },
    {
      title: 'Safety Checks',
      items: ['Electrical inspections', 'Circuit testing', 'Wire safety check', 'Panel evaluation', 'Code compliance']
    },
    {
      title: 'Other Services',
      items: ['Ceiling fan installation', 'Smoke detector setup', 'Generator hookup', 'EV charger install', 'Emergency repairs']
    }
  ];

  const safetyFeatures = [
    { icon: <Shield className="w-6 h-6" />, title: 'Licensed Electricians', description: 'Fully licensed and insured professionals' },
    { icon: <AlertTriangle className="w-6 h-6" />, title: 'Safety First', description: 'Following all electrical codes and standards' },
    { icon: <Zap className="w-6 h-6" />, title: '24/7 Emergency', description: 'Available for urgent electrical issues' },
    { icon: <CheckCircle className="w-6 h-6" />, title: 'Guaranteed Work', description: 'All electrical work fully guaranteed' }
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
            <Zap className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Electrical Work</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Professional electrical services including light fixtures, outlets, switches, and safety checks
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">
                Schedule Service
              </Link>
              <a href="tel:+1234567890" className="btn-secondary">
                <Phone className="w-5 h-5 mr-2" />
                Emergency Call
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Safety Notice */}
      <section className="py-8 bg-yellow-50 border-y border-yellow-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-yellow-800">
            <AlertTriangle className="w-6 h-6" />
            <p className="font-semibold">All electrical work performed by licensed electricians following safety codes</p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Electrical Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Safe, professional electrical work for your home
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

      {/* Safety Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-12">Your Safety is Our Priority</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safetyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="neural-bg rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Electrical Work? Call Our Experts</h2>
            <p className="text-xl mb-8 text-blue-100">Licensed electricians ready to help 24/7</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Book Service
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

export default ElectricalWorkPage;
