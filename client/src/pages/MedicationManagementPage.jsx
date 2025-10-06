import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pill, Activity, CheckCircle, Users, Shield, Phone, ArrowRight, Sparkles } from 'lucide-react';

const MedicationManagementPage = () => {
  const services = [
    {
      title: 'Medication Administration',
      items: ['Timely medication delivery', 'Dosage verification', 'Prescription tracking', 'Multiple medication coordination', 'Administration documentation']
    },
    {
      title: 'Prescription Management',
      items: ['Pharmacy coordination', 'Refill scheduling', 'Doctor communication', 'Insurance assistance', 'Cost optimization support']
    },
    {
      title: 'Health Monitoring',
      items: ['Vital signs tracking', 'Side effect observation', 'Medication effectiveness monitoring', 'Health status reporting', 'Doctor follow-up coordination']
    },
    {
      title: 'Safety & Compliance',
      items: ['Medication safety protocols', 'Drug interaction prevention', 'Adherence monitoring', 'Emergency response', 'Family communication']
    }
  ];

  const benefits = [
    { icon: <Pill className="w-6 h-6" />, title: 'Accurate Dosing', description: 'Precise medication administration' },
    { icon: <Shield className="w-6 h-6" />, title: 'Safety First', description: 'Prevent medication errors' },
    { icon: <Users className="w-6 h-6" />, title: 'Expert Care', description: 'Trained medication specialists' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Peace of Mind', description: 'Reliable medication compliance' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Pill className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Medication Management</h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8">
              Professional medication monitoring and administration for senior safety and wellbeing
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary bg-white text-purple-600 hover:bg-gray-100">
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
            <h2 className="section-title">Medication Management Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive medication support ensuring proper administration, safety, and compliance
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
          <h2 className="section-title text-center mb-12">Why Choose Our Medication Management</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
            <h2 className="section-title text-center mb-12">Our Medication Safety Approach</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Comprehensive Tracking</h3>
                <p className="text-gray-600">
                  We maintain detailed medication records, track schedules meticulously, and coordinate
                  with healthcare providers to ensure proper administration. Our systematic approach
                  prevents errors and ensures optimal medication effectiveness.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Personalized Support</h3>
                <p className="text-gray-600">
                  Every senior has unique medication needs. We create individualized medication plans,
                  monitor for side effects, and adjust care as needed in consultation with physicians,
                  ensuring safe and effective medication management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Safe Medication Management at Home</h2>
            <p className="text-xl mb-8 text-purple-100">Expert support for proper medication administration and monitoring</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-purple-600 hover:bg-gray-100">
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

export default MedicationManagementPage;
