import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';

const BlogPage = () => {
  const posts = [
    {
      title: '10 Tips for Creating a Safe Home Environment for Seniors',
      excerpt: 'Learn essential safety modifications and precautions to prevent accidents and create a comfortable living space for elderly loved ones.',
      author: 'Dr. Sarah Mitchell',
      date: '2025-09-28',
      category: 'Safety',
      image: 'safety'
    },
    {
      title: 'Understanding Memory Care: What Families Need to Know',
      excerpt: 'A comprehensive guide to memory care services, dementia support, and how to choose the right care approach for your loved one.',
      author: 'James Rodriguez, RN',
      date: '2025-09-25',
      category: 'Elder Care',
      image: 'memory'
    },
    {
      title: 'The Importance of Social Connection for Senior Health',
      excerpt: 'Discover how maintaining social relationships and community involvement can significantly impact the physical and mental health of seniors.',
      author: 'Emily Chen, MSW',
      date: '2025-09-20',
      category: 'Wellness',
      image: 'social'
    },
    {
      title: 'Nutrition Guidelines for Healthy Aging',
      excerpt: 'Expert advice on meal planning, dietary needs, and nutrition strategies to support health and vitality in older adults.',
      author: 'Dr. Michael Thompson',
      date: '2025-09-15',
      category: 'Health',
      image: 'nutrition'
    },
    {
      title: 'Caring for the Caregiver: Self-Care Strategies',
      excerpt: 'Essential tips for family caregivers to manage stress, prevent burnout, and maintain their own health while caring for loved ones.',
      author: 'Lisa Anderson, LCSW',
      date: '2025-09-10',
      category: 'Caregiving',
      image: 'caregiver'
    },
    {
      title: 'Home Modifications: Making Aging in Place Possible',
      excerpt: 'Practical home improvement ideas and accessibility modifications that enable seniors to live independently and safely at home.',
      author: 'Robert Wilson',
      date: '2025-09-05',
      category: 'Home Safety',
      image: 'modifications'
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
            <BookOpen className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Care & Wellness Blog</h1>
            <p className="text-xl text-blue-100">
              Expert insights, tips, and resources for senior care and healthy aging.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card group hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/30" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-600 text-sm font-semibold rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <User className="w-4 h-4 mr-1" />
                    <span className="mr-4">{post.author}</span>
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>

                  <button className="text-blue-600 font-semibold flex items-center group-hover:gap-2 transition-all">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto card p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Informed</h2>
            <p className="text-gray-600 mb-6">
              Subscribe to our newsletter for the latest care tips, health insights, and updates.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 neural-bg text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Expert Care Advice?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Our experienced care team is ready to answer your questions.
          </p>
          <a href="/contact" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
            Contact Our Team
          </a>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
