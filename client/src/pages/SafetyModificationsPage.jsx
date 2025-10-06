import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Heart, Phone, ArrowRight, Home } from 'lucide-react';

const SafetyModificationsPage = () => {
  const services = [
    {
      title: 'Grab Bars & Railings',
      items: ['Bathroom grab bars', 'Stairway railings', 'Hallway support rails', 'Shower safety bars', 'Toilet grab bars']
    },
    {
      title: 'Ramps & Accessibility',
      items: ['Wheelchair ramps', 'Threshold ramps', 'Portable ramps', 'Deck ramps', 'Custom ramp solutions']
    },
    {
      title: 'Stair Lifts & Elevators',
      items: ['Stair lift installation', 'Curved stair lifts', 'Home elevator installation', 'Platform lifts', 'Vertical lifts']
    },
    {
      title: 'Other Modifications',
      items: ['Walk-in tubs', 'Curbless showers', 'Widened doorways', 'Lever door handles', 'Motion sensor lights']
    }
  ];

  const benefits = [
    { icon: <Shield className="w-6 h-6" />, title: 'Fall Prevention', description: 'Reduce risk of falls and injuries' },
    { icon: <Heart className="w-6 h-6" />, title: 'Independence', description: 'Maintain independence at home' },
    { icon: <Home className="w-6 h-6" />, title: 'Age in Place', description: 'Stay safely in your own home' },
    { icon: <CheckCircle className="w-6 h-6" />, title: 'Expert Install', description: 'Professional installation guaranteed' }
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
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Safety Modifications</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Professional installation of grab bars, ramps, stair lifts, and accessibility improvements
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">
                Schedule Assessment
              </Link>
              <a href="tel:+1234567890" className="btn-secondary">
                <Phone className="w-5 h-5 mr-2" />
                Call for Consultation
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Safety Solutions for Your Home</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Making homes safer and more accessible for seniors and those with mobility challenges
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
          <h2 className="section-title text-center mb-12">Benefits of Safety Modifications</h2>
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

      {/* Process Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-12">Our Process</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '1', title: 'Free Assessment', description: 'We visit your home to assess safety needs and recommend solutions' },
              { step: '2', title: 'Custom Plan', description: 'Receive a detailed plan with options and pricing tailored to your needs' },
              { step: '3', title: 'Professional Install', description: 'Our experts install all modifications with precision and care' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="neural-bg rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Make Your Home Safer Today</h2>
            <p className="text-xl mb-8 text-blue-100">Schedule a free safety assessment with our experts</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Request Assessment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/repair-services" className="btn-secondary border-2 border-white hover:bg-white/10">
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SafetyModificationsPage;
