'use client';

import React from 'react';
import Link from 'next/link';
import { COLORS } from 'shared/styles/theme';

const HelpPage = () => {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Help Center</h1>
        
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Help Center Coming Soon</h2>
          <p className="text-gray-600 mb-8">
            We're building a comprehensive help center with tutorials, guides, and FAQs.
          </p>
          <div className="space-y-4">
            <Link
              href="/contact"
              className="inline-block px-6 py-3 text-white rounded-md hover:opacity-90 transition-opacity mr-4"
              style={{ backgroundColor: COLORS.infoBlue }}
            >
              Contact Support
            </Link>
            <Link
              href="/"
              className="inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
