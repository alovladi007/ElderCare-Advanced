import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, Home, Zap, Droplet, Hammer, Lock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

const RepairServicesPage = () => {
  const services = [
    { icon: <Wrench />, title: 'General Repairs', description: 'Fix doors, windows, cabinets, and general household items' },
    { icon: <Zap />, title: 'Electrical Work', description: 'Light fixtures, outlets, switches, and electrical safety checks' },
    { icon: <Droplet />, title: 'Plumbing Services', description: 'Faucet repairs, pipe fixes, toilet repairs, and leak prevention' },
    { icon: <Home />, title: 'Safety Modifications', description: 'Grab bars, ramps, stair lifts, and accessibility improvements' },
    { icon: <Lock />, title: 'Security Upgrades', description: 'Lock installation, security system setup, and home safety' },
    { icon: <Hammer />, title: 'Handyman Services', description: 'Assembly, installation, painting, and general maintenance' }
  ];

  const emergencyServices = [
    'Burst Pipe Repairs',
    'Electrical Emergencies',
    'Lock Replacements',
    'Water Heater Issues',
    'HVAC Repairs',
    'Emergency Board-ups'
  ];

  return (
    <div className="min-h-screen">
      <section className="neural-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Home Repair & Maintenance</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Professional, reliable home repair and maintenance services to keep your home safe, functional, and comfortable.
            </p>
            <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100 inline-block">
              Request Service <ArrowRight className="inline ml-2" size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">Our Repair Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-6">
                  {React.cloneElement(service.icon, { className: 'w-10 h-10' })}
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">24/7 Emergency Services</h2>
            <p className="text-xl text-gray-600 mb-8">We're here when you need us most with rapid response emergency repair services.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {emergencyServices.map((service, i) => (
                <div key={i} className="flex items-center justify-center p-3 bg-white rounded-lg shadow">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium">{service}</span>
                </div>
              ))}
            </div>
            <a href="tel:+1234567890" className="btn-primary inline-block">Call Emergency Line: (123) 456-7890</a>
          </div>
        </div>
      </section>

      <section className="py-20 neural-bg text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Need Home Repairs or Maintenance?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Get a free estimate and schedule your service today.</p>
          <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">Schedule Service</Link>
        </div>
      </section>
    </div>
  );
};

export default RepairServicesPage;
