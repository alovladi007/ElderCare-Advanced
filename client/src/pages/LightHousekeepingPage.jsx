import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, CheckCircle, Sparkles, Recycle, Phone, ArrowRight, Shield } from 'lucide-react';

const LightHousekeepingPage = () => {
  const services = [
    {
      title: 'General Cleaning',
      items: ['Dusting and vacuuming', 'Floor sweeping and mopping', 'Bathroom sanitizing', 'Kitchen cleaning', 'Surface wiping and disinfecting']
    },
    {
      title: 'Laundry Services',
      items: ['Washing and drying clothes', 'Folding and organizing', 'Bed linen changes', 'Ironing assistance', 'Closet organization']
    },
    {
      title: 'Home Organization',
      items: ['Decluttering living spaces', 'Organizing personal items', 'Pantry arrangement', 'Seasonal clothing rotation', 'General tidying']
    },
    {
      title: 'Maintenance Support',
      items: ['Trash and recycling removal', 'Light bulb replacement', 'Mail collection and sorting', 'Plant watering', 'Pet care assistance']
    }
  ];

  const benefits = [
    { icon: <Home className="w-6 h-6" />, title: 'Safe Environment', description: 'Clean, organized, hazard-free living space' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Professional Service', description: 'Thorough and reliable housekeeping' },
    { icon: <Shield className="w-6 h-6" />, title: 'Peace of Mind', description: 'Trusted caregivers in your home' },
    { icon: <Recycle className="w-6 h-6" />, title: 'Eco-Friendly', description: 'Safe cleaning products and practices' }
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
            <Home className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Light Housekeeping Services</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Maintain a clean, comfortable, and safe home environment for your loved ones
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">
                Request Housekeeping
              </Link>
              <a href="tel:+1234567890" className="btn-secondary">
                <Phone className="w-5 h-5 mr-2" />
                Call Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Housekeeping Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive light housekeeping and home maintenance for comfortable living
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
          <h2 className="section-title text-center mb-12">Why Choose Our Housekeeping Services</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title text-center mb-12">Our Housekeeping Philosophy</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Safety-First Cleaning</h3>
                <p className="text-gray-600">
                  We prioritize fall prevention and safety in every task. Our caregivers are trained
                  to identify and eliminate hazards while maintaining a clean and organized home that
                  promotes independence and mobility.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Respectful Service</h3>
                <p className="text-gray-600">
                  Your home is your sanctuary. We treat every home with respect, following your
                  preferences and routines. Our caregivers maintain confidentiality and work
                  efficiently to minimize disruption to daily life.
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Clean Home, A Happy Life</h2>
            <p className="text-xl mb-8 text-blue-100">Let us help maintain a comfortable and safe living environment</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Schedule Housekeeping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/home-care" className="btn-secondary border-2 border-white hover:bg-white/10">
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LightHousekeepingPage;
