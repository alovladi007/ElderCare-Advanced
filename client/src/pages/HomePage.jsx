import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Home, Shield, Clock, Users, Star,
  CheckCircle, Phone, ArrowRight, Award,
  Activity, UserCog, Smartphone, Zap
} from 'lucide-react';

const HomePage = () => {
  const services = [
    {
      icon: <Heart className="w-12 h-12" />,
      title: 'Elder Care',
      description: 'Compassionate and professional care for seniors, ensuring comfort, dignity, and wellbeing.',
      features: ['24/7 Care', 'Medical Support', 'Companionship', 'Memory Care'],
      link: '/elder-care',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Home className="w-12 h-12" />,
      title: 'Home Care',
      description: 'Personalized in-home care services tailored to your family\'s unique needs.',
      features: ['Personal Care', 'Meal Preparation', 'Medication Management', 'Mobility Assistance'],
      link: '/home-care',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Home className="w-12 h-12" />,
      title: 'Smart Home Technology',
      description: 'Connected home automation and monitoring systems for enhanced safety, comfort, and independence.',
      features: ['Home Automation', 'Safety Monitoring', 'Voice Control', 'Emergency Alerts'],
      link: '/smart-home-services',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const stats = [
    { number: '2+', label: 'Years Experience' },
    { number: '150+', label: 'Families Served' },
    { number: '98%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'Availability' }
  ];

  const whyChooseUs = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Licensed & Insured',
      description: 'Fully licensed caregivers and insured services for your peace of mind.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Experienced Professionals',
      description: 'Highly trained and compassionate care professionals with years of experience.'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: '24/7 Support',
      description: 'Round-the-clock availability for emergencies and ongoing support.'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Award Winning',
      description: 'Recognized for excellence in senior care and customer satisfaction.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Daughter of Client',
      content: 'The care my mother receives is exceptional. The staff is professional, caring, and truly dedicated to her wellbeing.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Family Member',
      content: 'Outstanding service! They helped us modify our home for my father\'s safety and provided excellent care support.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Client',
      content: 'I feel safe and cared for. The caregivers are like family and the home repair services are top-notch.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative neural-bg text-white py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-6 neon-text"
            >
              Compassionate Care & Professional Home Services
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-blue-100"
            >
              Providing exceptional elder care, personalized home care, and reliable home repair services to families across the community.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/booking" className="btn-primary text-center">
                Schedule a Consultation
                <ArrowRight className="inline ml-2" size={20} />
              </Link>
              <Link to="/contact" className="btn-secondary bg-white/20 backdrop-blur-sm border-white text-white hover:bg-white/30 text-center">
                <Phone className="inline mr-2" size={20} />
                Call Us Now
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${10 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-title">Our Comprehensive Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We offer a full spectrum of care and home services designed to support seniors and families at every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card group hover:scale-105 transition-transform duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${service.color}`} />
                <div className="p-8">
                  <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={service.link}
                    className={`inline-flex items-center font-semibold bg-gradient-to-r ${service.color} bg-clip-text text-transparent hover:underline`}
                  >
                    Learn More
                    <ArrowRight className="ml-2" size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Access Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Access Your Platform
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-blue-100 max-w-3xl mx-auto"
            >
              Login to access your personalized dashboard, health monitoring, and care management tools
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: Users,
                title: 'Family Portal',
                description: 'Access care plans, appointments, and elder profiles',
                link: '/dashboard',
                color: 'from-blue-400 to-blue-600'
              },
              {
                icon: Smartphone,
                title: 'Elder Portal',
                description: 'View your care schedule and health information',
                link: '/elder-dashboard',
                color: 'from-purple-400 to-purple-600'
              },
              {
                icon: Activity,
                title: 'Health Monitoring',
                description: 'Real-time health tracking and vital sign monitoring',
                link: '/monitoring/dashboard',
                color: 'from-pink-400 to-pink-600'
              },
              {
                icon: UserCog,
                title: 'Employee Portal',
                description: 'Caregiver schedules and task management',
                link: '/employee-dashboard',
                color: 'from-indigo-400 to-indigo-600'
              },
              {
                icon: Zap,
                title: 'Smart Home Platform',
                description: 'Control devices, automations, and home monitoring',
                link: 'http://localhost:31616',
                color: 'from-orange-400 to-orange-600',
                external: true
              }
            ].map((portal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {portal.external ? (
                  <a
                    href={portal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all hover:scale-105 group"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${portal.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <portal.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{portal.title}</h3>
                    <p className="text-blue-100 text-sm mb-4">{portal.description}</p>
                    <div className="flex items-center text-white font-medium">
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Access Dashboard
                      <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                ) : (
                  <Link
                    to={portal.link}
                    className="block h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all hover:scale-105 group"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${portal.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <portal.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{portal.title}</h3>
                    <p className="text-blue-100 text-sm mb-4">{portal.description}</p>
                    <div className="flex items-center text-white font-medium">
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Access Dashboard
                      <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link
              to="/admin"
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm border-2 border-white text-white rounded-lg hover:bg-white/30 transition-all font-medium"
            >
              <Shield className="w-5 h-5 mr-2" />
              Admin Access
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-title">Why Choose Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing the highest quality care and services with integrity, compassion, and professionalism.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-title">What Our Families Say</h2>
            <p className="text-xl text-gray-600">Real stories from the families we serve</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card p-8"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 neural-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Schedule a free consultation today and discover how we can support your family's needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Book a Consultation
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

export default HomePage;
