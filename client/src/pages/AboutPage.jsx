import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Award, Users, Target, Shield, TrendingUp } from 'lucide-react';

const AboutPage = () => {
  const values = [
    { icon: <Heart />, title: 'Compassion', description: 'We treat every client with dignity, respect, and genuine care' },
    { icon: <Shield />, title: 'Trust', description: 'Building lasting relationships through reliability and transparency' },
    { icon: <Award />, title: 'Excellence', description: 'Committed to the highest standards in everything we do' },
    { icon: <Users />, title: 'Family', description: 'Creating a supportive community for clients and their families' }
  ];

  const team = [
    { name: 'Dr. Sarah Johnson', role: 'Medical Director', experience: '20+ years in geriatric care' },
    { name: 'Michael Chen', role: 'Operations Manager', experience: '15+ years in healthcare management' },
    { name: 'Emily Rodriguez', role: 'Head of Care Services', experience: '18+ years in elder care' }
  ];

  return (
    <div className="min-h-screen">
      <section className="neural-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">About ElderCare & HomeCare</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Over 15 years of dedicated service providing compassionate care and professional home services to families in our community.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title text-center mb-12">Our Mission</h2>
            <div className="card p-8 md:p-12">
              <Target className="w-16 h-16 text-blue-600 mx-auto mb-6" />
              <p className="text-xl text-gray-700 text-center leading-relaxed">
                To provide exceptional, personalized care and home services that enable seniors to live with dignity, independence, and comfort in their own homes while giving families peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                  {React.cloneElement(value.icon, { className: 'w-10 h-10' })}
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center mb-16">Our Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <div key={i} className="card p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.experience}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div><div className="text-4xl font-bold text-blue-600 mb-2">150+</div><div className="text-gray-600">Families Served</div></div>
            <div><div className="text-4xl font-bold text-blue-600 mb-2">98%</div><div className="text-gray-600">Satisfaction Rate</div></div>
            <div><div className="text-4xl font-bold text-blue-600 mb-2">2+</div><div className="text-gray-600">Years Experience</div></div>
            <div><div className="text-4xl font-bold text-blue-600 mb-2">12+</div><div className="text-gray-600">Care Professionals</div></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
