import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertCircle, CheckCircle } from 'lucide-react';

const TermsOfServicePage = () => {
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
            <Scale className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
            <p className="text-xl text-blue-100">
              Please read these terms carefully before using our services.
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
                Acceptance of Terms
              </h2>
              <p className="text-gray-600 mb-8">
                By accessing and using the services of Evergreen Home & Care Services ("we," "us," or "our"), you accept
                and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>

              <h2 className="text-2xl font-bold mb-4">Services Provided</h2>
              <p className="text-gray-600 mb-6">
                We provide the following services:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Elder care and senior care services</li>
                <li>In-home personal care assistance</li>
                <li>Home repair and maintenance services</li>
                <li>Care coordination and consultation</li>
                <li>Emergency response services</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-blue-600" />
                Client Responsibilities
              </h2>
              <p className="text-gray-600 mb-6">
                As a client, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Provide accurate and complete information about care needs</li>
                <li>Maintain a safe working environment for caregivers</li>
                <li>Notify us promptly of any changes in condition or requirements</li>
                <li>Treat our staff with respect and dignity</li>
                <li>Make timely payments for services rendered</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Payment Terms</h2>
              <p className="text-gray-600 mb-6">
                Payment for services is due as specified in your service agreement. We accept various payment methods
                including credit cards, checks, and insurance assignments. Late payments may result in:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Service interruption or suspension</li>
                <li>Late fees as permitted by law</li>
                <li>Collection actions</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Cancellation Policy</h2>
              <p className="text-gray-600 mb-6">
                Either party may terminate services with appropriate notice:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Clients must provide 24-hour notice for schedule changes</li>
                <li>We require 7 days' notice for service termination</li>
                <li>Emergency situations may be handled on a case-by-case basis</li>
                <li>Cancellation fees may apply for insufficient notice</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <AlertCircle className="w-6 h-6 mr-2 text-blue-600" />
                Limitation of Liability
              </h2>
              <p className="text-gray-600 mb-6">
                To the fullest extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount paid for services</li>
                <li>We maintain appropriate insurance coverage</li>
                <li>Clients acknowledge inherent risks in care services</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Confidentiality</h2>
              <p className="text-gray-600 mb-6">
                We maintain strict confidentiality of all client information in accordance with HIPAA and applicable
                privacy laws. All staff members sign confidentiality agreements and receive regular privacy training.
              </p>

              <h2 className="text-2xl font-bold mb-4">Quality Assurance</h2>
              <p className="text-gray-600 mb-6">
                We are committed to providing high-quality services through:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Thorough background checks and screening</li>
                <li>Ongoing staff training and development</li>
                <li>Regular quality assessments</li>
                <li>Client feedback and satisfaction monitoring</li>
                <li>Compliance with all applicable regulations</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
              <p className="text-gray-600 mb-6">
                Any disputes arising from these terms or our services shall be resolved through:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-8 space-y-2">
                <li>Good faith negotiation between parties</li>
                <li>Mediation if negotiation fails</li>
                <li>Binding arbitration as a last resort</li>
                <li>Governing law of the state where services are provided</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Modifications</h2>
              <p className="text-gray-600 mb-6">
                We reserve the right to modify these Terms of Service at any time. We will notify clients of significant
                changes via email or written notice. Continued use of our services after changes constitutes acceptance
                of the modified terms.
              </p>

              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="text-gray-600 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> legal@eldercare.com</p>
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

export default TermsOfServicePage;
