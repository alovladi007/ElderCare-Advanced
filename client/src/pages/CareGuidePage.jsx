import React from 'react';
import { motion } from 'framer-motion';
import { Book, Heart, Shield, Users, Clock, CheckCircle } from 'lucide-react';

const CareGuidePage = () => {
  const guides = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Elder Care Basics',
      description: 'Understanding the fundamentals of caring for elderly loved ones.',
      topics: ['Daily Care Routines', 'Nutrition & Hydration', 'Safety at Home', 'Emotional Support']
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Safety & Prevention',
      description: 'Essential safety measures to protect seniors in their homes.',
      topics: ['Fall Prevention', 'Medication Safety', 'Emergency Preparedness', 'Home Modifications']
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Family Caregiving',
      description: 'Support and resources for family caregivers.',
      topics: ['Self-Care for Caregivers', 'Managing Stress', 'Communication Tips', 'Respite Care']
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Daily Living Activities',
      description: 'Assistance with everyday tasks and routines.',
      topics: ['Personal Hygiene', 'Meal Preparation', 'Mobility Assistance', 'Household Tasks']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="neural-bg text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Book className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Care Guide</h1>
            <p className="text-xl text-blue-100">
              Comprehensive resources and information to help you provide the best care for your loved ones.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Guide Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guides.map((guide, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-6">
                  {guide.icon}
                </div>
                <h2 className="text-2xl font-bold mb-3">{guide.title}</h2>
                <p className="text-gray-600 mb-6">{guide.description}</p>
                <ul className="space-y-2">
                  {guide.topics.map((topic, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{topic}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="section-title text-center mb-12">Essential Care Tips</h2>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-xl font-bold mb-3">Communication is Key</h3>
              <p className="text-gray-600">
                Maintain open and honest communication with your loved one. Listen actively,
                speak clearly, and be patient. Regular conversations help maintain emotional
                connections and allow you to better understand their needs.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-bold mb-3">Maintain a Routine</h3>
              <p className="text-gray-600">
                Consistency provides comfort and security. Establish regular schedules for
                meals, medications, activities, and rest. This helps reduce confusion and
                anxiety while promoting better health.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-bold mb-3">Encourage Independence</h3>
              <p className="text-gray-600">
                Support your loved one in maintaining their independence as much as safely
                possible. Allow them to make choices and participate in daily activities.
                This preserves dignity and promotes physical and mental wellbeing.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-bold mb-3">Monitor Health Changes</h3>
              <p className="text-gray-600">
                Pay attention to changes in physical or mental health, appetite, mood, or
                behavior. Keep track of medications and medical appointments. Report any
                concerns to healthcare providers promptly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 neural-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Professional Support?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Our experienced care team is here to help you and your family.
          </p>
          <a href="/contact" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
            Contact Us Today
          </a>
        </div>
      </section>
    </div>
  );
};

export default CareGuidePage;
