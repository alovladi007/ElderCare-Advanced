import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Heart, CheckCircle, Users, Shield, Phone, ArrowRight, Sparkles } from 'lucide-react';

const TwentyFourSevenCarePage = () => {
  const services = [
    {
      title: 'Round-the-Clock Support',
      items: ['24/7 caregiver availability', 'Day and night supervision', 'Emergency response ready', 'Continuous safety monitoring', 'Peace of mind for families']
    },
    {
      title: 'Overnight Care',
      items: ['Night-time assistance', 'Sleep monitoring', 'Medication reminders', 'Bathroom support', 'Fall prevention overnight']
    },
    {
      title: 'Live-In Care',
      items: ['Full-time dedicated caregiver', 'Comprehensive daily support', 'Meal preparation and feeding', 'Personal care assistance', 'Companionship and engagement']
    },
    {
      title: 'Respite Care',
      items: ['Temporary relief for family', 'Short or long-term coverage', 'Consistent care quality', 'Flexible scheduling', 'Professional backup support']
    }
  ];

  const benefits = [
    { icon: <Clock className="w-6 h-6" />, title: 'Always Available', description: 'Round-the-clock care whenever needed' },
    { icon: <Shield className="w-6 h-6" />, title: 'Safety Assured', description: 'Constant monitoring for security' },
    { icon: <Users className="w-6 h-6" />, title: 'Trained Professionals', description: 'Experienced 24/7 care specialists' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Family Peace', description: 'Rest easy knowing loved ones are safe' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Clock className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">24/7 Personal Care</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Round-the-clock compassionate care and support for your loved ones
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
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
            <h2 className="section-title">24/7 Care Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive around-the-clock care ensuring safety, comfort, and dignity at all hours
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
          <h2 className="section-title text-center mb-12">Why Choose Our 24/7 Care</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
            <h2 className="section-title text-center mb-12">Our 24/7 Care Philosophy</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Continuous Monitoring</h3>
                <p className="text-gray-600">
                  Our caregivers provide vigilant, compassionate supervision around the clock, ensuring
                  your loved one's safety and wellbeing at all hours. We're always there when needed,
                  day or night, providing peace of mind for the entire family.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Flexible Care Plans</h3>
                <p className="text-gray-600">
                  Whether you need overnight assistance, live-in care, or temporary respite support,
                  we customize our 24/7 services to match your family's specific needs and schedule,
                  ensuring seamless, quality care at all times.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Round-the-Clock Care You Can Trust</h2>
            <p className="text-xl mb-8 text-blue-100">Professional support available 24/7 for your loved ones</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
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

export default TwentyFourSevenCarePage;
