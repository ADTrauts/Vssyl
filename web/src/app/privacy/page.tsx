'use client';

import React from 'react';
import Link from 'next/link';
import { COLORS } from 'shared/styles/theme';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold" style={{ color: COLORS.infoBlue }}>
                  Vssyl
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: COLORS.infoBlue }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
          <p className="text-gray-600 mb-6">
            We collect information you provide directly to us, such as when you create an account, 
            use our services, or contact us for support.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Protect against fraud and abuse</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
          <p className="text-gray-600 mb-6">
            We implement appropriate technical and organizational measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Rights</h2>
          <p className="text-gray-600 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your personal information</li>
            <li>Object to processing of your information</li>
            <li>Data portability</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">GDPR Compliance</h2>
          <p className="text-gray-600 mb-6">
            We are committed to compliance with the General Data Protection Regulation (GDPR) 
            and other applicable privacy laws.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">
              Email: privacy@vssyl.com<br />
              Address: 123 Innovation Drive, Tech Valley, CA 94000
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Questions About Privacy?</h3>
            <p className="text-gray-600 mb-4">
              Our privacy team is here to help with any questions or concerns.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 text-white rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: COLORS.infoBlue }}
            >
              Contact Privacy Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
