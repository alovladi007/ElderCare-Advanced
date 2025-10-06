import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, CheckCircle, Heart, Utensils, Phone, ArrowRight, Sparkles } from 'lucide-react';

const MealPreparationPage = () => {
  const services = [
    {
      title: 'Meal Planning & Preparation',
      items: ['Customized meal planning', 'Fresh ingredient selection', 'Nutritious meal cooking', 'Special diet accommodations', 'Portion control assistance']
    },
    {
      title: 'Nutritional Support',
      items: ['Diabetic-friendly meals', 'Heart-healthy options', 'Low-sodium preparations', 'Texture-modified foods', 'Dietary restriction adherence']
    },
    {
      title: 'Kitchen Services',
      items: ['Grocery shopping assistance', 'Food storage organization', 'Kitchen cleaning', 'Leftover management', 'Meal packaging and labeling']
    },
    {
      title: 'Dining Assistance',
      items: ['Meal presentation', 'Feeding assistance', 'Hydration monitoring', 'Mealtime companionship', 'Adaptive utensil support']
    }
  ];

  const benefits = [
    { icon: <Heart className="w-6 h-6" />, title: 'Better Health', description: 'Proper nutrition for overall wellness' },
    { icon: <Utensils className="w-6 h-6" />, title: 'Personalized Menus', description: 'Meals tailored to taste and needs' },
    { icon: <ChefHat className="w-6 h-6" />, title: 'Professional Care', description: 'Trained caregivers who understand nutrition' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Quality Ingredients', description: 'Fresh, healthy meal preparation' }
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
            <ChefHat className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Meal Preparation & Nutrition</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Delicious, nutritious meals prepared with care in the comfort of home
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">
                Request Meal Services
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
            <h2 className="section-title">Meal Preparation Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive meal planning, preparation, and nutritional support for seniors
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
          <h2 className="section-title text-center mb-12">Why Choose Our Meal Services</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
            <h2 className="section-title text-center mb-12">Our Nutrition-Focused Approach</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Dietary Expertise</h3>
                <p className="text-gray-600">
                  Our caregivers are trained to prepare meals that meet specific dietary requirements,
                  whether managing diabetes, heart conditions, or other health needs. We work with
                  healthcare providers to ensure nutritional goals are met.
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-bold mb-3">Personalized Preferences</h3>
                <p className="text-gray-600">
                  We respect cultural traditions, favorite recipes, and personal tastes. Our meal
                  preparation service ensures your loved one enjoys delicious food that brings
                  comfort and satisfaction to every meal.
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nutritious Meals Made with Love</h2>
            <p className="text-xl mb-8 text-blue-100">Support your loved one's health with proper nutrition</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Schedule Meal Services
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

export default MealPreparationPage;
