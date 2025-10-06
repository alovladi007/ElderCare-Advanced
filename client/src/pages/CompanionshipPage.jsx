import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Heart, Smile, Phone, ArrowRight, Coffee } from 'lucide-react';

const CompanionshipPage = () => {
  const services = [
    {
      title: 'Social Interaction',
      items: ['Meaningful conversations', 'Shared hobbies and interests', 'Reading together', 'Watching favorite shows', 'Playing games and puzzles']
    },
    {
      title: 'Activities & Outings',
      items: ['Local errands and shopping', 'Doctor appointment accompaniment', 'Parks and outdoor activities', 'Cultural events', 'Religious services']
    },
    {
      title: 'Emotional Support',
      items: ['Active listening', 'Reducing isolation', 'Memory sharing', 'Positive encouragement', 'Family updates']
    },
    {
      title: 'Engagement Programs',
      items: ['Arts and crafts', 'Music and sing-alongs', 'Light exercise', 'Book clubs', 'Virtual family calls']
    }
  ];

  const benefits = [
    { icon: <Heart className="w-6 h-6" />, title: 'Combat Loneliness', description: 'Reduce social isolation and depression' },
    { icon: <Smile className="w-6 h-6" />, title: 'Improve Wellbeing', description: 'Mental and emotional health support' },
    { icon: <Users className="w-6 h-6" />, title: 'Trusted Friends', description: 'Build lasting relationships' },
    { icon: <Coffee className="w-6 h-6" />, title: 'Quality Time', description: 'Enjoyable and meaningful interactions' }
  ];

  return (
    <div className="min-h-screen">
      <section className="neural-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto text-center">
            <Users className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Companionship Services</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Social interaction, activities, and emotional support to enrich daily life
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">Find a Companion</Link>
              <a href="tel:+1234567890" className="btn-secondary"><Phone className="w-5 h-5 mr-2" />Call Us</a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Companionship Activities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Engaging activities and meaningful connections</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="card">
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

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-12">Benefits of Companionship Care</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="neural-bg rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">More Than Just Care - It's Friendship</h2>
            <p className="text-xl mb-8 text-blue-100">Bring joy and connection to your loved one's day</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">Start Companionship<ArrowRight className="w-5 h-5 ml-2" /></Link>
              <Link to="/home-care" className="btn-secondary border-2 border-white hover:bg-white/10">View All Services</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompanionshipPage;
