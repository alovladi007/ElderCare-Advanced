import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hammer, CheckCircle, Clock, Star, Phone, ArrowRight, Package } from 'lucide-react';

const HandymanServicesPage = () => {
  const services = [
    {
      title: 'Assembly Services',
      items: ['Furniture assembly', 'Ikea assembly', 'Exercise equipment', 'Shelving units', 'Office furniture']
    },
    {
      title: 'Installation',
      items: ['TV mounting', 'Curtain rod installation', 'Picture hanging', 'Mirror mounting', 'Closet organization']
    },
    {
      title: 'Painting & Finishing',
      items: ['Interior painting', 'Touch-up work', 'Trim painting', 'Cabinet refinishing', 'Color consultation']
    },
    {
      title: 'General Maintenance',
      items: ['Pressure washing', 'Gutter cleaning', 'Seasonal maintenance', 'Minor carpentry', 'Odd jobs']
    }
  ];

  const benefits = [
    { icon: <Clock className="w-6 h-6" />, title: 'On-Time Service', description: 'We value your time and arrive promptly' },
    { icon: <Star className="w-6 h-6" />, title: 'Skilled Experts', description: 'Experienced handymen for any job' },
    { icon: <Package className="w-6 h-6" />, title: 'All-in-One', description: 'Handle multiple tasks in one visit' },
    { icon: <CheckCircle className="w-6 h-6" />, title: 'Satisfaction Guaranteed', description: 'We stand behind our work' }
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
            <Hammer className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Handyman Services</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Professional assembly, installation, painting, and general maintenance services for your home
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-primary">
                Book a Handyman
              </Link>
              <a href="tel:+1234567890" className="btn-secondary">
                <Phone className="w-5 h-5 mr-2" />
                Call for Quote
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Our Handyman Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From small repairs to big projects, we're your all-in-one handyman solution
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
          <h2 className="section-title text-center mb-12">Why Choose Our Handyman Services</h2>
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
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Projects */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-12">Popular Handyman Projects</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: 'TV Mounting', description: 'Professional mounting with cable management' },
              { title: 'Furniture Assembly', description: 'Quick and accurate assembly service' },
              { title: 'Painting Touch-ups', description: 'Fresh paint for walls and trim' },
              { title: 'Shelf Installation', description: 'Secure mounting for all shelf types' },
              { title: 'Picture Hanging', description: 'Gallery walls and single pieces' },
              { title: 'Home Repairs', description: 'Small fixes and maintenance tasks' }
            ].map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card text-center"
              >
                <h3 className="text-lg font-bold mb-2">{project.title}</h3>
                <p className="text-gray-600 text-sm">{project.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="neural-bg rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Got a To-Do List? We Can Help!</h2>
            <p className="text-xl mb-8 text-blue-100">Book our handyman service and check off those tasks</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/booking" className="btn-secondary bg-white text-blue-600 hover:bg-gray-100">
                Schedule Service
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

export default HandymanServicesPage;
