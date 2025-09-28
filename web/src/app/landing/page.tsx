'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Brain, 
  Zap, 
  Users, 
  Shield, 
  BarChart3, 
  MessageSquare, 
  FolderOpen, 
  Calendar,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Sparkles
} from 'lucide-react';
import { COLORS } from 'shared/styles/theme';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold" style={{ color: COLORS.infoBlue }}>
                  Vssyl
                </h1>
              </div>
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your AI-Powered
              <span className="block" style={{ color: COLORS.infoBlue }}>
                Digital Workspace
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Vssyl combines advanced AI intelligence with modular productivity tools to create 
              the ultimate digital workspace that learns, adapts, and grows with you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: COLORS.infoBlue }}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to boost productivity, collaborate effectively, and make data-driven decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Digital Life Twin */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Brain className="h-8 w-8 mr-3" style={{ color: COLORS.infoBlue }} />
                <h3 className="text-xl font-semibold text-gray-900">AI Digital Life Twin</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Advanced AI that learns your patterns, preferences, and workflows to provide intelligent assistance and automation.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Predictive intelligence
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Automated workflows
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Personalized recommendations
                </li>
              </ul>
            </div>

            {/* Modular Architecture */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 mr-3" style={{ color: COLORS.infoBlue }} />
                <h3 className="text-xl font-semibold text-gray-900">Modular Platform</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Extensible architecture with a marketplace of modules. Add only what you need, when you need it.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Third-party integrations
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Custom modules
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Developer marketplace
                </li>
              </ul>
            </div>

            {/* Real-time Collaboration */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 mr-3" style={{ color: COLORS.infoBlue }} />
                <h3 className="text-xl font-semibold text-gray-900">Team Collaboration</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Real-time collaboration tools that keep your team connected and productive, wherever they are.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Live chat & messaging
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  File sharing
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Real-time notifications
                </li>
              </ul>
            </div>

            {/* Advanced Analytics */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 mr-3" style={{ color: COLORS.infoBlue }} />
                <h3 className="text-xl font-semibold text-gray-900">Advanced Analytics</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Comprehensive analytics platform with real-time insights, predictive intelligence, and AI-powered recommendations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Real-time dashboards
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Predictive insights
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Business intelligence
                </li>
              </ul>
            </div>

            {/* Enterprise Security */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 mr-3" style={{ color: COLORS.infoBlue }} />
                <h3 className="text-xl font-semibold text-gray-900">Enterprise Security</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Bank-level security with advanced compliance features, audit logging, and data protection.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  GDPR & HIPAA compliance
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  End-to-end encryption
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Audit trails
                </li>
              </ul>
            </div>

            {/* Global Platform */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <Globe className="h-8 w-8 mr-3" style={{ color: COLORS.infoBlue }} />
                <h3 className="text-xl font-semibold text-gray-900">Global Platform</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Scalable cloud infrastructure with global reach, multi-language support, and 99.9% uptime.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Global CDN
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Multi-region deployment
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  24/7 monitoring
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Modules Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Essential Productivity Modules
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Core modules that power your daily workflow, with more available in our marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.infoBlue }} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat & Messaging</h3>
              <p className="text-gray-600 text-sm">Real-time communication with file sharing and reactions</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.infoBlue }} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Drive & Files</h3>
              <p className="text-gray-600 text-sm">Secure file storage with advanced sharing and collaboration</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.infoBlue }} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar & Scheduling</h3>
              <p className="text-gray-600 text-sm">Smart scheduling with AI-powered optimization</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.infoBlue }} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
              <p className="text-gray-600 text-sm">Intelligent automation and personalized recommendations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your needs. Start free and scale as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-md">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  $0<span className="text-lg font-normal text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">Perfect for individuals getting started</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Basic AI assistant</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Core modules included</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">5GB storage</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Basic analytics</span>
                </li>
              </ul>
              <Link
                href="/auth/register"
                className="w-full block text-center py-3 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 rounded-lg p-8 shadow-lg relative" style={{ borderColor: COLORS.infoBlue }}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: COLORS.infoBlue }}>
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  $29<span className="text-lg font-normal text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">For professionals and growing teams</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Advanced AI features</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">All core modules + premium</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">100GB storage</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Priority support</span>
                </li>
              </ul>
              <Link
                href="/auth/register"
                className="w-full block text-center py-3 px-4 rounded-md text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: COLORS.infoBlue }}
              >
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-md">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  Custom<span className="text-lg font-normal text-gray-600"></span>
                </div>
                <p className="text-gray-600 mb-6">For large organizations with custom needs</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Full AI capabilities</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Unlimited modules</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Unlimited storage</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  <span className="text-gray-600">24/7 dedicated support</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="w-full block text-center py-3 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of teams already using Vssyl to boost productivity and collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.infoBlue }}>
                Vssyl
              </h3>
              <p className="text-gray-400">
                The revolutionary digital workspace platform that combines AI intelligence with modular productivity tools.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link href="/modules" className="text-gray-400 hover:text-white">Modules</Link></li>
                <li><Link href="/integrations" className="text-gray-400 hover:text-white">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link href="/docs" className="text-gray-400 hover:text-white">Documentation</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Vssyl. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
