import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPolicyPage = () => {
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
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-xl text-blue-100">
              Your privacy and security are our top priorities.
            </p>
            <p className="text-sm text-blue-200 mt-4">Last Updated: October 2025</p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="card p-8 md:p-12">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                Information We Collect
              </h2>
              <p className="text-gray-600 mb-6">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Personal identification information (name, email address, phone number, etc.)</li>
                <li>Medical and health information necessary for care services</li>
                <li>Payment and billing information</li>
                <li>Communication preferences and correspondence</li>
                <li>Service requests and booking information</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-2 text-blue-600" />
                How We Use Your Information
              </h2>
              <p className="text-gray-600 mb-6">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Provide, maintain, and improve our care services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Comply with legal obligations and protect rights and safety</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-2 text-blue-600" />
                Information Sharing
              </h2>
              <p className="text-gray-600 mb-6">
                We do not sell or rent your personal information. We may share information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>With healthcare providers necessary for care coordination</li>
                <li>With service providers who assist in our operations</li>
                <li>When required by law or to protect rights and safety</li>
                <li>With your consent or at your direction</li>
                <li>In connection with a merger, sale, or acquisition (with notice)</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-gray-600 mb-6">
                We implement appropriate technical and organizational measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Restricted access to personal information</li>
                <li>Employee training on data protection</li>
                <li>Secure disposal of information when no longer needed</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
              <p className="text-gray-600 mb-6">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Access and receive a copy of your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to or restrict processing of your information</li>
                <li>Withdraw consent at any time</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 mb-6">
                We use cookies and similar tracking technologies to collect and track information about your use of our
                services. You can control cookies through your browser settings, though some features may not function
                properly if cookies are disabled.
              </p>

              <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
              <p className="text-gray-600 mb-6">
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal
                information from children. If you become aware that a child has provided us with personal information,
                please contact us.
              </p>

              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 mb-6">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy
                Policy periodically.
              </p>

              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> privacy@eldercare.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> (123) 456-7890</p>
                <p className="text-gray-700"><strong>Address:</strong> 123 Care Street, New York, NY 10001</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
