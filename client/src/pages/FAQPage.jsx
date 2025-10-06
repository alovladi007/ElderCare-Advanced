import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'General Questions',
      questions: [
        {
          q: 'What services do you offer?',
          a: 'We provide comprehensive elder care, home care, and home repair services. This includes 24/7 personal care, memory care, health monitoring, medication management, meal preparation, housekeeping, and various home repair and maintenance services.'
        },
        {
          q: 'What areas do you serve?',
          a: 'We currently serve the greater metropolitan area and surrounding communities. Contact us to confirm service availability in your specific location.'
        },
        {
          q: 'Are your caregivers licensed and insured?',
          a: 'Yes, all our caregivers are fully licensed, background-checked, and insured. We maintain strict quality standards and ongoing training for all staff members.'
        }
      ]
    },
    {
      category: 'Services & Care',
      questions: [
        {
          q: 'How do I know what level of care my loved one needs?',
          a: 'We offer free consultations to assess care needs. Our experienced team will evaluate physical, emotional, and medical requirements to recommend the appropriate level of care and services.'
        },
        {
          q: 'Can services be customized to specific needs?',
          a: 'Absolutely! We create personalized care plans tailored to each individual\'s unique needs, preferences, and schedule. Our services are flexible and can be adjusted as needs change.'
        },
        {
          q: 'Do you provide 24/7 care?',
          a: 'Yes, we offer round-the-clock care services for clients who need continuous support. We can arrange live-in caregivers or rotating shifts to ensure 24/7 coverage.'
        }
      ]
    },
    {
      category: 'Pricing & Payment',
      questions: [
        {
          q: 'How much do your services cost?',
          a: 'Costs vary based on the type and frequency of services required. We offer competitive rates and flexible payment options. Contact us for a personalized quote based on your specific needs.'
        },
        {
          q: 'Do you accept insurance?',
          a: 'We accept various insurance plans and can help coordinate with Medicare, Medicaid, and private insurance providers. Our team can assist with insurance verification and claims processing.'
        },
        {
          q: 'Are there any long-term contracts required?',
          a: 'No, we don\'t require long-term contracts. Our services are flexible and can be scheduled on a short-term or long-term basis based on your needs.'
        }
      ]
    },
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How quickly can services begin?',
          a: 'In many cases, we can begin services within 24-48 hours after the initial consultation and assessment, depending on availability and care requirements.'
        },
        {
          q: 'What happens during the first consultation?',
          a: 'Our initial consultation includes a thorough assessment of care needs, home environment evaluation, discussion of preferences and schedules, and development of a customized care plan. This consultation is completely free.'
        },
        {
          q: 'Can I request a specific caregiver?',
          a: 'Yes! We try to match caregivers with clients based on personality, experience, and preferences. If you develop a rapport with a particular caregiver, we\'ll do our best to maintain consistency.'
        }
      ]
    }
  ];

  const toggleFAQ = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

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
            <HelpCircle className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-blue-100">
              Find answers to common questions about our services, pricing, and care options.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          {faqs.map((category, catIndex) => (
            <div key={catIndex} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, qIndex) => {
                  const index = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === index;

                  return (
                    <motion.div
                      key={qIndex}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: qIndex * 0.05 }}
                      className="card"
                    >
                      <button
                        onClick={() => toggleFAQ(catIndex, qIndex)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-lg pr-8">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6">
                          <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Our team is here to help. Contact us for personalized answers and support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn-primary">
              Contact Us
            </a>
            <a href="/booking" className="btn-secondary">
              Schedule Consultation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
