import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Stethoscope, CheckCircle, Users, Shield, Phone, ArrowRight, Sparkles } from 'lucide-react';

const HealthMonitoringPage = () => {
  const services = [
    {
      title: 'Vital Signs Monitoring',
      items: ['Blood pressure tracking', 'Heart rate monitoring', 'Temperature checks', 'Oxygen level measurement', 'Weight monitoring']
    },
    {
      title: 'Health Assessments',
      items: ['Regular health evaluations', 'Symptom observation', 'Mobility assessments', 'Cognitive screening', 'Pain level monitoring']
    },
    {
      title: 'Chronic Condition Management',
      items: ['Diabetes monitoring', 'Heart disease tracking', 'Respiratory care support', 'Arthritis management', 'Post-surgical recovery']
    },
    {
      title: 'Care Coordination',
      items: ['Doctor appointment coordination', 'Health status reporting', 'Medical team communication', 'Emergency response', 'Family health updates']
    }
  ];

  const benefits = [
    { icon: <Activity className="w-6 h-6" />, title: 'Early Detection', description: 'Identify health changes quickly' },
    { icon: <Shield className="w-6 h-6" />, title: 'Preventive Care', description: 'Proactive health management' },
    { icon: <Users className="w-6 h-6" />, title: 'Professional Staff', description: 'Medically trained caregivers' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Better Outcomes', description: 'Improved health and wellness' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-800 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Activity className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Health Monitoring</h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8">
              Comprehensive health monitoring and assessments for optimal senior wellness
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary bg-white text-red-600 hover:bg-gray-100">
                Request Care
              </Link>
              <a href="tel:+1234567890" className="btn-secondary border-2 border-white hover:bg-white/10">
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
            <h2 className="section-title">Health Monitoring Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional health tracking and assessment services to maintain senior wellbeing
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
          <h2 className="section-title text-center mb-12">Why Choose Our Health Monitoring</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
            <h2 className="section-title text-center mb-12">Our Health Monitoring Approach</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Proactive Health Management</h3>
                <p className="text-gray-600">
                  Our caregivers conduct regular health assessments and vital signs monitoring to detect
                  changes early. We maintain detailed records, communicate with healthcare providers, and
                  ensure timely interventions to prevent complications and hospitalizations.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Personalized Monitoring Plans</h3>
                <p className="text-gray-600">
                  Every senior has unique health needs. We develop customized monitoring protocols based
                  on individual conditions, physician recommendations, and family preferences, ensuring
                  comprehensive care that addresses specific health concerns and goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Health Monitoring at Home</h2>
            <p className="text-xl mb-8 text-red-100">Expert health tracking and assessments for senior wellness</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-red-600 hover:bg-gray-100">
                Schedule Care
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/elder-care" className="btn-secondary border-2 border-white hover:bg-white/10">
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HealthMonitoringPage;
