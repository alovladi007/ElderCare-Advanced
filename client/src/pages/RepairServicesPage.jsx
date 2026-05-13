import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, Home, Zap, Droplet, Hammer, Lock, AlertCircle, ArrowRight, CheckCircle, Shield, Clock, Award } from 'lucide-react';

const RepairServicesPage = () => {
  const services = [
    {
      icon: <Wrench />,
      title: 'General Repairs',
      description: 'Expert repair of doors, windows, cabinets, drywall, flooring, and general household items. We handle everything from minor fixes to major repairs.',
      link: '/general-repairs'
    },
    {
      icon: <Zap />,
      title: 'Electrical Work',
      description: 'Licensed electricians for light fixtures, outlets, switches, circuit breakers, and comprehensive electrical safety inspections.',
      link: '/electrical-work'
    },
    {
      icon: <Droplet />,
      title: 'Plumbing Services',
      description: 'Professional plumbing repairs including faucets, pipes, toilets, water heaters, drain cleaning, and leak detection and prevention.',
      link: '/plumbing-services'
    },
    {
      icon: <Home />,
      title: 'Safety Modifications',
      description: 'Specialized accessibility improvements including grab bars, wheelchair ramps, stair lifts, walk-in tubs, and non-slip flooring installation.',
      link: '/safety-modifications'
    },
    {
      icon: <Lock />,
      title: 'Security Upgrades',
      description: 'Comprehensive security solutions including smart locks, security cameras, alarm systems, motion sensors, and home safety assessments.',
      link: '/security-upgrades'
    },
    {
      icon: <Hammer />,
      title: 'Handyman Services',
      description: 'Full-service handyman work including furniture assembly, shelf installation, picture hanging, painting, pressure washing, and routine maintenance.',
      link: '/handyman-services'
    }
  ];

  const emergencyServices = [
    'Burst Pipe Repairs',
    'Electrical Emergencies',
    'Lock Replacements',
    'Water Heater Issues',
    'HVAC Repairs',
    'Emergency Board-ups'
  ];

  const whyChooseUs = [
    { icon: <Shield />, title: 'Licensed & Insured', description: 'All technicians are fully licensed, bonded, and insured for your protection' },
    { icon: <Clock />, title: 'Prompt Service', description: 'Same-day and emergency services available with quick response times' },
    { icon: <Award />, title: 'Quality Guaranteed', description: 'We stand behind our work with comprehensive warranties and satisfaction guarantee' }
  ];

  return (
    <div className="min-h-screen">
      <section className="neural-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Home Repair & Maintenance</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Professional, reliable home repair and maintenance services to keep your home safe, functional, and comfortable. From minor repairs to major renovations, our skilled technicians handle it all.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100 inline-block">
                Request Service <ArrowRight className="inline ml-2" size={20} />
              </Link>
              <a href="tel:+1234567890" className="btn-primary bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 inline-block">
                Call Now: (123) 456-7890
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white mr-4 flex-shrink-0">
                  {React.cloneElement(item.icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">Our Repair Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <Link to={service.link} key={i}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-8 hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white mb-6">
                    {React.cloneElement(service.icon, { className: 'w-10 h-10' })}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <span className="text-blue-600 font-semibold flex items-center">
                    Learn More <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">24/7 Emergency Services</h2>
            <p className="text-xl text-gray-700 mb-8">Home emergencies don't wait for business hours. Our rapid response team is available 24/7/365 to handle your urgent repair needs.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {emergencyServices.map((service, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-800">{service}</span>
                </motion.div>
              ))}
            </div>
            <div className="bg-red-600 text-white rounded-xl p-6 inline-block">
              <p className="text-sm uppercase tracking-wide mb-2 font-semibold">Emergency Hotline</p>
              <a href="tel:+1234567890" className="text-3xl md:text-4xl font-bold hover:text-red-100 transition-colors">(123) 456-7890</a>
              <p className="text-sm mt-2 text-red-100">Available 24 hours a day, 7 days a week</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 neural-bg text-white text-center">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl md:text-2xl mb-10 text-blue-100">
              Let us handle your home repairs and maintenance needs. Get a free, no-obligation estimate today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                Schedule Service <ArrowRight className="inline ml-2" size={20} />
              </Link>
              <a href="tel:+1234567890" className="btn-primary bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
                Call Us: (123) 456-7890
              </a>
            </div>
            <p className="text-sm text-blue-200 mt-8">
              <CheckCircle className="inline w-4 h-4 mr-1" /> Free Estimates
              <span className="mx-3">•</span>
              <CheckCircle className="inline w-4 h-4 mr-1" /> Same-Day Service Available
              <span className="mx-3">•</span>
              <CheckCircle className="inline w-4 h-4 mr-1" /> Satisfaction Guaranteed
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default RepairServicesPage;
