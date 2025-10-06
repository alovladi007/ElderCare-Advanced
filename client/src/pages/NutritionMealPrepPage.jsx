import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Apple, UtensilsCrossed, CheckCircle, Users, Shield, Phone, ArrowRight, Sparkles } from 'lucide-react';

const NutritionMealPrepPage = () => {
  const services = [
    {
      title: 'Meal Planning',
      items: ['Nutritionist-approved menus', 'Dietary restriction adherence', 'Cultural food preferences', 'Diabetic meal planning', 'Heart-healthy options']
    },
    {
      title: 'Meal Preparation',
      items: ['Fresh ingredient selection', 'Safe food handling', 'Therapeutic diet preparation', 'Texture-modified meals', 'Portion control support']
    },
    {
      title: 'Feeding Assistance',
      items: ['Mealtime companionship', 'Feeding support', 'Swallowing assistance', 'Hydration monitoring', 'Adaptive utensil support']
    },
    {
      title: 'Nutritional Monitoring',
      items: ['Weight tracking', 'Appetite monitoring', 'Supplement management', 'Dietary goal tracking', 'Doctor communication']
    }
  ];

  const benefits = [
    { icon: <Apple className="w-6 h-6" />, title: 'Healthy Nutrition', description: 'Balanced, nutritious meals daily' },
    { icon: <Shield className="w-6 h-6" />, title: 'Safe Preparation', description: 'Food safety protocols followed' },
    { icon: <Users className="w-6 h-6" />, title: 'Trained Staff', description: 'Nutrition-educated caregivers' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Better Health', description: 'Improved wellness through diet' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Apple className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Nutrition & Meal Preparation</h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8">
              Healthy, delicious meals tailored to senior nutritional needs and preferences
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary bg-white text-green-600 hover:bg-gray-100">
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
            <h2 className="section-title">Nutrition & Meal Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive meal planning, preparation, and nutritional support for senior health
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
          <h2 className="section-title text-center mb-12">Why Choose Our Nutrition Services</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
            <h2 className="section-title text-center mb-12">Our Nutritional Care Philosophy</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Personalized Nutrition</h3>
                <p className="text-gray-600">
                  We understand that proper nutrition is vital for senior health and wellbeing. Our
                  caregivers work with families and healthcare providers to create meal plans that meet
                  dietary requirements, respect cultural preferences, and appeal to individual tastes.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Mealtime as Connection</h3>
                <p className="text-gray-600">
                  Meals are more than sustenance—they're opportunities for social engagement and joy.
                  We provide companionship during mealtimes, encourage proper nutrition, and make eating
                  an enjoyable experience that promotes both physical and emotional wellbeing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nutritious Meals for Senior Health</h2>
            <p className="text-xl mb-8 text-green-100">Professional meal planning and preparation for optimal nutrition</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-green-600 hover:bg-gray-100">
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

export default NutritionMealPrepPage;
