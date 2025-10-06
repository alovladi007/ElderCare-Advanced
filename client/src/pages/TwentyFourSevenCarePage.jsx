import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Moon, Home, HeartHandshake, Shield, Phone, ArrowRight, CheckCircle2, Star, Users, Sparkles, Calendar } from 'lucide-react';

const TwentyFourSevenCarePage = () => {
  const services = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Round-the-Clock Support',
      description: 'Always available when you need us most',
      items: ['24/7 caregiver availability', 'Day and night supervision', 'Emergency response ready', 'Continuous safety monitoring', 'Peace of mind for families'],
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Moon className="w-8 h-8" />,
      title: 'Overnight Care',
      description: 'Safe, comfortable nighttime assistance',
      items: ['Night-time assistance', 'Sleep monitoring', 'Medication reminders', 'Bathroom support', 'Fall prevention overnight'],
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Home className="w-8 h-8" />,
      title: 'Live-In Care',
      description: 'Dedicated full-time professional support',
      items: ['Full-time dedicated caregiver', 'Comprehensive daily support', 'Meal preparation and feeding', 'Personal care assistance', 'Companionship and engagement'],
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: <HeartHandshake className="w-8 h-8" />,
      title: 'Respite Care',
      description: 'Relief and support for family caregivers',
      items: ['Temporary relief for family', 'Short or long-term coverage', 'Consistent care quality', 'Flexible scheduling', 'Professional backup support'],
      gradient: 'from-rose-500 to-pink-500'
    }
  ];

  const benefits = [
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Safety First',
      description: 'Continuous monitoring ensures your loved one is always protected and secure'
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: 'Expert Caregivers',
      description: 'Highly trained professionals specialized in 24/7 elder care support'
    },
    {
      icon: <Calendar className="w-7 h-7" />,
      title: 'Flexible Plans',
      description: 'Customized care schedules that adapt to your family\'s unique needs'
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: 'Peace of Mind',
      description: 'Rest easy knowing your loved ones receive exceptional care around the clock'
    }
  ];

  const stats = [
    { number: '24/7', label: 'Availability' },
    { number: '100%', label: 'Dedicated Care' },
    { number: '1000+', label: 'Families Served' },
    { number: '15+', label: 'Years Experience' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAydjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-8 border border-white/20"
            >
              <Clock className="w-12 h-12" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              24/7 Personal Care
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed max-w-3xl mx-auto">
              Round-the-clock compassionate care and support for your loved ones
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-16">
              <Link to="/booking" className="group px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl flex items-center">
                Request Care
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="tel:+1234567890" className="px-8 py-4 border-2 border-white/30 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Call Us Now
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-blue-100 text-sm md:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </section>

      {/* Services Grid - Enhanced Cards */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
              Our Services
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">24/7 Care Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive around-the-clock care ensuring safety, comfort, and dignity at all hours
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${service.gradient} text-white rounded-2xl mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-gray-800">{service.title}</h3>
                  <p className="text-gray-500 mb-6">{service.description}</p>

                  <ul className="space-y-3">
                    {service.items.map((item, idx) => (
                      <li key={idx} className="flex items-start group/item">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits - Redesigned */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
              Why Choose Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Evergreen Difference</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the highest standard of 24/7 care with our dedicated team
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - New Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
              Our Process
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How 24/7 Care Works</h2>
          </motion.div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Free Consultation', desc: 'We assess your loved one\'s needs and create a personalized care plan' },
              { step: '02', title: 'Caregiver Match', desc: 'We pair you with experienced caregivers who match your specific requirements' },
              { step: '03', title: 'Care Begins', desc: 'Your loved one receives compassionate, professional care around the clock' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="text-7xl font-bold text-blue-100 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-blue-200"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-12 md:p-16 text-center text-white overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAydjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <Star className="w-12 h-12 mx-auto mb-6 fill-yellow-300 text-yellow-300" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Round-the-Clock Care You Can Trust</h2>
              <p className="text-xl md:text-2xl mb-10 text-blue-100 leading-relaxed">
                Professional support available 24/7 for your loved ones. Experience compassionate care that never sleeps.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/booking" className="group px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl inline-flex items-center">
                  Schedule Care Today
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/elder-care" className="px-8 py-4 border-2 border-white/30 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/10 transition-all inline-flex items-center">
                  View All Elder Care Services
                </Link>
              </div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TwentyFourSevenCarePage;
