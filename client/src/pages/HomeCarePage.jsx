import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, Clock, Heart, CheckCircle, ArrowRight, Sparkles, ShieldCheck, Calendar } from 'lucide-react';

const HomeCarePage = () => {
  const services = [
    { icon: <Users />, title: 'Personal Care Assistance', description: 'Help with bathing, dressing, grooming, and personal hygiene', link: '/personal-care' },
    { icon: <Heart />, title: 'Companionship Services', description: 'Social interaction, activities, and emotional support', link: '/companionship' },
    { icon: <Sparkles />, title: 'Meal Preparation', description: 'Nutritious meal planning and cooking based on dietary needs', link: '/meal-preparation' },
    { icon: <Home />, title: 'Light Housekeeping', description: 'Cleaning, laundry, and maintaining a comfortable living environment', link: '/light-housekeeping' },
    { icon: <ShieldCheck />, title: 'Safety Supervision', description: 'Fall prevention, medication reminders, and safety monitoring', link: '/safety-supervision' }
  ];

  return (
    <div className="min-h-screen">
      <section className="neural-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Home Care Services</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Professional in-home care services that allow your loved ones to age gracefully in the comfort of their own home.
            </p>
            <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100 inline-block">
              Get Started Today <ArrowRight className="inline ml-2" size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">Our Home Care Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <Link to={service.link} key={i}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-8 hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-6">
                    {React.cloneElement(service.icon, { className: 'w-10 h-10' })}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <span className="text-purple-600 font-semibold flex items-center">
                    Learn More <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 neural-bg text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Ready for Personalized Home Care?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Schedule a free in-home assessment today.</p>
          <Link to="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">Book Assessment</Link>
        </div>
      </section>
    </div>
  );
};

export default HomeCarePage;
