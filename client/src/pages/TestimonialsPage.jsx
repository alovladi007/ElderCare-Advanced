import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const TestimonialsPage = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Daughter of Client',
      content: 'The care my mother receives is exceptional. The staff is professional, caring, and truly dedicated to her wellbeing. They treat her with such dignity and respect, it brings me peace of mind knowing she\'s in good hands.',
      rating: 5,
      service: 'Elder Care'
    },
    {
      name: 'Michael Chen',
      role: 'Family Member',
      content: 'Outstanding service! They helped us modify our home for my father\'s safety and provided excellent care support. The team was knowledgeable, responsive, and went above and beyond our expectations.',
      rating: 5,
      service: 'Home Care & Repairs'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Client',
      content: 'I feel safe and cared for in my own home. The caregivers are like family, and the home repair services are top-notch. I couldn\'t ask for better support as I age in place.',
      rating: 5,
      service: 'Home Care'
    },
    {
      name: 'Robert Thompson',
      role: 'Son of Client',
      content: 'After trying several care services, we finally found the right fit. The consistency of caregivers and the quality of care has been remarkable. My dad is happier and healthier than he\'s been in years.',
      rating: 5,
      service: 'Elder Care'
    },
    {
      name: 'Linda Martinez',
      role: 'Family Caregiver',
      content: 'As a family caregiver, the respite care has been a lifesaver. I can take time for myself knowing my husband is receiving excellent care. The staff truly understands the challenges we face.',
      rating: 5,
      service: 'Respite Care'
    },
    {
      name: 'James Wilson',
      role: 'Client',
      content: 'The emergency repair service saved the day when my bathroom needed urgent attention. Quick response, professional work, and fair pricing. Highly recommend their home maintenance services.',
      rating: 5,
      service: 'Home Repairs'
    },
    {
      name: 'Patricia Davis',
      role: 'Daughter of Client',
      content: 'Communication has been outstanding. The care team keeps us updated and involves us in all decisions. They truly partner with families to provide the best possible care.',
      rating: 5,
      service: 'Elder Care'
    },
    {
      name: 'David Lee',
      role: 'Grandson of Client',
      content: 'My grandmother loves her caregiver and looks forward to their time together each day. The companionship and personal attention have made such a difference in her quality of life.',
      rating: 5,
      service: 'Companionship Care'
    },
    {
      name: 'Maria Garcia',
      role: 'Client',
      content: 'The meal preparation service has been wonderful. The caregivers prepare nutritious meals that I actually enjoy. It\'s made managing my diet so much easier.',
      rating: 5,
      service: 'Home Care'
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
            <Quote className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Client Testimonials</h1>
            <p className="text-xl text-blue-100">
              Hear from the families and individuals we're honored to serve.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">Client Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600">Happy Families</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-8 flex flex-col"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic flex-grow">
                  "{testimonial.content}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-blue-600 mt-1">{testimonial.service}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 neural-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Experience the Difference</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join our growing family of satisfied clients and experience compassionate,
            professional care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/booking" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Schedule Consultation
            </a>
            <a href="/contact" className="btn-secondary bg-white/20 backdrop-blur-sm border-white text-white hover:bg-white/30">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestimonialsPage;
