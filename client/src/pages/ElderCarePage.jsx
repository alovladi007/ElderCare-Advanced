import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Clock, Shield, Users, Activity, Brain, Stethoscope,
  Home, Utensils, Pill, HeartPulse, CheckCircle, ArrowRight, Monitor
} from 'lucide-react';

const ElderCarePage = () => {
  const services = [
    {
      icon: <HeartPulse className="w-10 h-10" />,
      title: '24/7 Personal Care',
      description: 'Round-the-clock assistance with daily living activities including bathing, dressing, grooming, and mobility support.',
      link: '/24-7-care'
    },
    {
      icon: <Monitor className="w-10 h-10" />,
      title: 'Remote Health Monitoring',
      description: 'AI-powered medical devices tracking blood pressure, sugar levels, heart rate with 24/7 alerts to doctors and emergency services.',
      link: '/remote-health-monitoring',
      badge: 'Advanced Tech'
    },
    {
      icon: <Pill className="w-10 h-10" />,
      title: 'Medication Management',
      description: 'Careful monitoring and administration of medications according to prescribed schedules to ensure health and safety.',
      link: '/medication-management'
    },
    {
      icon: <Brain className="w-10 h-10" />,
      title: 'Memory Care',
      description: 'Specialized care for individuals with Alzheimer\'s, dementia, and other cognitive impairments with compassionate support.',
      link: '/memory-care'
    },
    {
      icon: <Stethoscope className="w-10 h-10" />,
      title: 'Health Monitoring',
      description: 'Regular vital signs monitoring, health assessments, and coordination with healthcare providers for comprehensive care.',
      link: '/health-monitoring'
    },
    {
      icon: <Utensils className="w-10 h-10" />,
      title: 'Nutrition & Meal Prep',
      description: 'Nutritious meal planning and preparation tailored to dietary needs, preferences, and medical restrictions.',
      link: '/nutrition-meal-prep'
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: 'Companionship',
      description: 'Social engagement, conversation, activities, and emotional support to combat loneliness and promote wellbeing.',
      link: '/elder-companionship'
    }
  ];

  const careApproach = [
    {
      title: 'Personalized Care Plans',
      description: 'Every senior is unique. We create customized care plans based on individual needs, preferences, and health conditions.'
    },
    {
      title: 'Trained Caregivers',
      description: 'Our caregivers undergo extensive training in elder care, first aid, CPR, and specialized conditions like dementia care.'
    },
    {
      title: 'Family Communication',
      description: 'Regular updates and open communication with family members to ensure peace of mind and collaborative care.'
    },
    {
      title: 'Safety First',
      description: 'Comprehensive safety protocols, fall prevention strategies, and emergency response systems in place.'
    }
  ];

  const specializations = [
    'Alzheimer\'s & Dementia Care',
    'Post-Surgery Recovery',
    'Chronic Condition Management',
    'End-of-Life Care (Hospice Support)',
    'Stroke Recovery',
    'Parkinson\'s Disease Care',
    'Arthritis & Mobility Support',
    'Diabetes Management'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="neural-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="flex items-center mb-6">
              <Heart className="w-16 h-16 mr-4" />
              <h1 className="text-4xl md:text-6xl font-bold">Elder Care Services</h1>
            </div>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Compassionate, professional care that honors dignity, promotes independence, and enhances quality of life for seniors.
            </p>
            <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100 inline-block">
              Schedule a Care Assessment
              <ArrowRight className="inline ml-2" size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-title">Comprehensive Elder Care Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide a full range of elder care services designed to support seniors in living comfortably and safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Link to={service.link} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-8 hover:shadow-2xl transition-all cursor-pointer relative"
                >
                  {service.badge && (
                    <span className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full">
                      {service.badge}
                    </span>
                  )}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-6">
                    {service.icon}
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

      {/* Our Approach */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-title">Our Care Approach</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in person-centered care that respects individuality and promotes dignity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {careApproach.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex"
              >
                <div className="mr-4 flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title text-center mb-12">Specialized Care Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specializations.map((spec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="font-medium">{spec}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 neural-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Start Your Care Journey Today</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Contact us for a free, no-obligation consultation to discuss your loved one's care needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Schedule Consultation
            </Link>
            <Link to="/contact" className="btn-secondary bg-white/20 backdrop-blur-sm border-white text-white hover:bg-white/30">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ElderCarePage;
