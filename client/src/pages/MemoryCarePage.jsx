import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Heart, CheckCircle, Users, Shield, Phone, ArrowRight, Sparkles } from 'lucide-react';

const MemoryCarePage = () => {
  const services = [
    {
      title: 'Alzheimer\'s Care',
      items: ['Specialized Alzheimer\'s support', 'Cognitive engagement activities', 'Routine maintenance', 'Memory-focused exercises', 'Family education and support']
    },
    {
      title: 'Dementia Support',
      items: ['Dementia-trained caregivers', 'Behavioral management', 'Communication techniques', 'Wandering prevention', 'Safe environment creation']
    },
    {
      title: 'Cognitive Stimulation',
      items: ['Memory enhancement activities', 'Brain fitness exercises', 'Social engagement programs', 'Art and music therapy', 'Reminiscence therapy']
    },
    {
      title: 'Daily Living Assistance',
      items: ['Personal care support', 'Meal preparation assistance', 'Medication reminders', 'Safety supervision', 'Compassionate companionship']
    }
  ];

  const benefits = [
    { icon: <Brain className="w-6 h-6" />, title: 'Specialized Care', description: 'Dementia and Alzheimer\'s expertise' },
    { icon: <Shield className="w-6 h-6" />, title: 'Safe Environment', description: 'Memory-focused safety protocols' },
    { icon: <Users className="w-6 h-6" />, title: 'Trained Staff', description: 'Certified memory care specialists' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Quality of Life', description: 'Dignity and engagement focused' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Brain className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Memory Care</h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-8">
              Specialized care for Alzheimer's, dementia, and memory-related conditions
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary bg-white text-indigo-600 hover:bg-gray-100">
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
            <h2 className="section-title">Memory Care Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compassionate, specialized care for seniors living with memory impairment
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
          <h2 className="section-title text-center mb-12">Why Choose Our Memory Care</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
            <h2 className="section-title text-center mb-12">Our Memory Care Philosophy</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Person-Centered Care</h3>
                <p className="text-gray-600">
                  We see beyond the disease to the person within. Our caregivers are specially trained
                  in dementia care, using validation techniques and therapeutic activities to maintain
                  dignity, reduce anxiety, and enhance quality of life for those with memory loss.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Family Partnership</h3>
                <p className="text-gray-600">
                  Memory care affects the entire family. We provide education, emotional support, and
                  regular communication to help families navigate this journey. Our goal is to create
                  meaningful moments and preserve connections despite cognitive decline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Compassionate Memory Care at Home</h2>
            <p className="text-xl mb-8 text-indigo-100">Specialized support for seniors with Alzheimer's and dementia</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-indigo-600 hover:bg-gray-100">
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

export default MemoryCarePage;
