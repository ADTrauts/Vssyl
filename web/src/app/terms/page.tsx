'use client';

import React from 'react';
import Link from 'next/link';
import { COLORS } from 'shared/styles/theme';

const TermsPage = () => {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
          <p className="text-gray-600 mb-6">
            By accessing and using Vssyl, you accept and agree to be bound by the terms and 
            provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Use License</h2>
          <p className="text-gray-600 mb-4">
            Permission is granted to temporarily use Vssyl for personal and commercial use. 
            This is the grant of a license, not a transfer of title, and under this license you may:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>Use the service for legitimate business purposes</li>
            <li>Create and manage workspaces and content</li>
            <li>Collaborate with team members</li>
            <li>Access AI-powered features within your subscription limits</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Prohibited Uses</h2>
          <p className="text-gray-600 mb-4">You may not use Vssyl:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li>For any unlawful purpose or to solicit others to unlawful acts</li>
            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>To submit false or misleading information</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Service Availability</h2>
          <p className="text-gray-600 mb-6">
            We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. 
            We reserve the right to modify or discontinue the service with reasonable notice.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Payment Terms</h2>
          <p className="text-gray-600 mb-6">
            Subscription fees are billed in advance on a monthly or annual basis. All fees are 
            non-refundable except as required by law or as specifically stated in our refund policy.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Intellectual Property</h2>
          <p className="text-gray-600 mb-6">
            The service and its original content, features, and functionality are and will remain 
            the exclusive property of Vssyl and its licensors.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
          <p className="text-gray-600 mb-6">
            In no event shall Vssyl, nor its directors, employees, partners, agents, suppliers, 
            or affiliates, be liable for any indirect, incidental, special, consequential, or 
            punitive damages.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Information</h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">
              Email: legal@vssyl.com<br />
              Address: 123 Innovation Drive, Tech Valley, CA 94000
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-4">
              By creating an account, you agree to these terms and our privacy policy.
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-6 py-3 text-white rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: COLORS.infoBlue }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
