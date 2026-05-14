import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Users, Brain, Stethoscope, Utensils, Pill,
  HeartPulse, CheckCircle, ArrowRight, Monitor
} from 'lucide-react';
import { Section, Container, Card, Badge, Button } from '../components';

const ElderCarePage = () => {
  const services = [
    {
      icon: HeartPulse,
      title: '24/7 Personal Care',
      description: 'Round-the-clock assistance with daily living activities including bathing, dressing, grooming, and mobility support.',
      link: '/24-7-care'
    },
    {
      icon: Monitor,
      title: 'Remote Health Monitoring',
      description: 'AI-powered medical devices tracking blood pressure, sugar levels, heart rate with 24/7 alerts to doctors and emergency services.',
      link: '/remote-health-monitoring',
      badge: 'Advanced Tech'
    },
    {
      icon: Pill,
      title: 'Medication Management',
      description: 'Careful monitoring and administration of medications according to prescribed schedules to ensure health and safety.',
      link: '/medication-management'
    },
    {
      icon: Brain,
      title: 'Memory Care',
      description: 'Specialized care for individuals with Alzheimer\'s, dementia, and other cognitive impairments with compassionate support.',
      link: '/memory-care'
    },
    {
      icon: Stethoscope,
      title: 'Health Monitoring',
      description: 'Regular vital signs monitoring, health assessments, and coordination with healthcare providers for comprehensive care.',
      link: '/health-monitoring'
    },
    {
      icon: Utensils,
      title: 'Nutrition & Meal Prep',
      description: 'Nutritious meal planning and preparation tailored to dietary needs, preferences, and medical restrictions.',
      link: '/nutrition-meal-prep'
    },
    {
      icon: Users,
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
      <Section
        background="gradient"
        padding="xl"
      >
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
          <Link to="/booking">
            <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="bg-white text-blue-600 hover:bg-gray-100">
              Schedule a Care Assessment
            </Button>
          </Link>
        </motion.div>
      </Section>

      {/* Services Grid */}
      <Section
        title="Comprehensive Elder Care Services"
        subtitle="We provide a full range of elder care services designed to support seniors in living comfortably and safely."
        background="white"
        padding="lg"
        centered
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Link to={service.link} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  icon={service.icon}
                  title={service.title}
                  badge={service.badge}
                  hoverable
                  clickable
                  padding="lg"
                >
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <span className="text-blue-600 font-semibold flex items-center">
                    Learn More <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Our Approach */}
      <Section
        title="Our Care Approach"
        subtitle="We believe in person-centered care that respects individuality and promotes dignity."
        background="gray"
        padding="lg"
        centered
        containerSize="default"
      >
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
      </Section>

      {/* Specializations */}
      <Section
        title="Specialized Care Programs"
        background="white"
        padding="lg"
        centered
        containerSize="default"
      >
        <div className="max-w-4xl mx-auto">
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
      </Section>

      {/* CTA Section */}
      <Section
        background="gradient"
        padding="lg"
        centered
      >
        <h2 className="text-4xl font-bold mb-6">Start Your Care Journey Today</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Contact us for a free, no-obligation consultation to discuss your loved one's care needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/booking">
            <Button variant="primary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Schedule Consultation
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" size="lg" className="bg-white/20 backdrop-blur-sm border-white text-white hover:bg-white/30">
              Contact Us
            </Button>
          </Link>
        </div>
      </Section>
    </div>
  );
};

export default ElderCarePage;
