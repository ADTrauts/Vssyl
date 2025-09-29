'use client';

import React from 'react';
import Link from 'next/link';
import { COLORS } from 'shared/styles/theme';

const AboutPage = () => {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Vssyl</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-6">
            Vssyl is a revolutionary digital workspace platform that combines AI intelligence 
            with modular productivity tools to create the ultimate workspace experience.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-6">
            We believe that work should be intelligent, intuitive, and inspiring. Our mission is to 
            create a digital workspace that learns from you, adapts to your needs, and grows with 
            your business.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What Makes Us Different</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
            <li><strong>AI-Powered Digital Life Twin:</strong> Advanced AI that learns your patterns and preferences</li>
            <li><strong>Modular Architecture:</strong> Add only the features you need with our extensible platform</li>
            <li><strong>Real-time Collaboration:</strong> Work together seamlessly with your team</li>
            <li><strong>Enterprise Security:</strong> Bank-level security with compliance features</li>
            <li><strong>Global Platform:</strong> Scalable infrastructure with 99.9% uptime</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Vision</h2>
          <p className="text-gray-600 mb-6">
            We envision a future where technology seamlessly integrates with human creativity and 
            productivity. Vssyl is designed to be more than just a tool – it's your intelligent 
            digital partner that helps you achieve more while working smarter, not harder.
          </p>

          <div className="bg-blue-50 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-4">
              Join thousands of teams already using Vssyl to transform their workflow.
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-6 py-3 text-white rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: COLORS.infoBlue }}
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
