import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Smile, CheckCircle, Heart, Shield, Phone, ArrowRight, Sparkles } from 'lucide-react';

const ElderCompanionshipPage = () => {
  const services = [
    {
      title: 'Social Engagement',
      items: ['Meaningful conversation', 'Shared activities and hobbies', 'Game playing and puzzles', 'Reading companionship', 'Technology assistance']
    },
    {
      title: 'Activity Companionship',
      items: ['Walking and exercise support', 'Shopping assistance', 'Cultural event attendance', 'Garden and outdoor activities', 'Pet care companionship']
    },
    {
      title: 'Emotional Support',
      items: ['Active listening', 'Loneliness prevention', 'Depression monitoring', 'Life story sharing', 'Family connection facilitation']
    },
    {
      title: 'Community Connection',
      items: ['Social club participation', 'Religious service attendance', 'Volunteer activity support', 'Family gathering assistance', 'Friend visit coordination']
    }
  ];

  const benefits = [
    { icon: <Users className="w-6 h-6" />, title: 'Reduce Isolation', description: 'Combat loneliness with companionship' },
    { icon: <Shield className="w-6 h-6" />, title: 'Trusted Care', description: 'Compassionate, vetted companions' },
    { icon: <Heart className="w-6 h-6" />, title: 'Emotional Wellbeing', description: 'Improved mental health and mood' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Quality of Life', description: 'Enhanced happiness and engagement' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 to-orange-800 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Users className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Elder Companionship</h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-8">
              Meaningful social engagement and companionship to enrich senior lives
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary bg-white text-orange-600 hover:bg-gray-100">
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
            <h2 className="section-title">Companionship Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional companionship services to combat isolation and enhance senior quality of life
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
          <h2 className="section-title text-center mb-12">Why Choose Our Companionship Care</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
            <h2 className="section-title text-center mb-12">Our Companionship Philosophy</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Genuine Connection</h3>
                <p className="text-gray-600">
                  Social isolation is a serious concern for seniors. Our companions provide more than
                  just presence—they build authentic relationships through shared interests, engaging
                  conversations, and meaningful activities that bring joy and purpose to daily life.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Personalized Engagement</h3>
                <p className="text-gray-600">
                  We match companions based on personalities, interests, and preferences to ensure
                  natural connections. Whether it's reminiscing about the past, exploring new hobbies,
                  or simply enjoying quiet company, we tailor companionship to individual needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meaningful Companionship for Seniors</h2>
            <p className="text-xl mb-8 text-orange-100">Combat isolation with caring, engaging companionship services</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-orange-600 hover:bg-gray-100">
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

export default ElderCompanionshipPage;
