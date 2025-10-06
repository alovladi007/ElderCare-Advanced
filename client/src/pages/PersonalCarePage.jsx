import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, CheckCircle, Users, Shield, Phone, ArrowRight, Sparkles } from 'lucide-react';

const PersonalCarePage = () => {
  const services = [
    {
      title: 'Bathing Assistance',
      items: ['Safe bathing support', 'Shower and tub assistance', 'Hair washing', 'Skin care', 'Personal dignity maintained']
    },
    {
      title: 'Dressing Support',
      items: ['Clothing selection', 'Dressing assistance', 'Adaptive clothing help', 'Shoe fitting', 'Seasonal wardrobe management']
    },
    {
      title: 'Grooming Services',
      items: ['Hair care and styling', 'Shaving assistance', 'Nail care', 'Oral hygiene', 'Makeup application']
    },
    {
      title: 'Personal Hygiene',
      items: ['Toileting assistance', 'Incontinence care', 'Catheter care', 'Skin monitoring', 'Hygiene routine support']
    }
  ];

  const benefits = [
    { icon: <Heart className="w-6 h-6" />, title: 'Dignity & Respect', description: 'Compassionate care that honors independence' },
    { icon: <Shield className="w-6 h-6" />, title: 'Safety First', description: 'Trained professionals ensuring safe care' },
    { icon: <Users className="w-6 h-6" />, title: 'Consistent Caregivers', description: 'Build trust with regular care team' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Quality Care', description: 'Certified and background-checked staff' }
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
            <Heart className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Personal Care Assistance</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Compassionate help with bathing, dressing, grooming, and personal hygiene
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">
                Request Care
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
            <h2 className="section-title">Personal Care Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional assistance with daily personal care activities in the comfort of home
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
          <h2 className="section-title text-center mb-12">Why Choose Our Personal Care</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
            <h2 className="section-title text-center mb-12">Our Person-Centered Approach</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Respect & Dignity</h3>
                <p className="text-gray-600">
                  We understand that personal care is intimate. Our caregivers are trained to provide
                  assistance with sensitivity, respect, and professionalism while preserving your loved
                  one's dignity and independence.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Customized Care Plans</h3>
                <p className="text-gray-600">
                  Every individual has unique needs and preferences. We create personalized care plans
                  that respect routines, cultural practices, and personal choices to ensure comfort
                  and satisfaction.
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Compassionate Personal Care at Home</h2>
            <p className="text-xl mb-8 text-blue-100">Let us help your loved one maintain dignity and comfort</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Schedule Care
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

export default PersonalCarePage;
