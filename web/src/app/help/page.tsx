'use client';

import React from 'react';
import Link from 'next/link';
import { COLORS } from 'shared/styles/theme';

const faqs = [
  {
    q: 'What is Vssyl?',
    a: 'Vssyl is a modular workspace platform — a dashboard home for chat, files, calendar, AI, and installable applications for personal and business use.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. Personal users can start free. Paid tiers unlock additional features — see Pricing on the home page or /billing after sign-in.',
  },
  {
    q: 'How do I join my company\'s workspace?',
    a: 'Use the link in your invitation email. It opens /auth/accept-invitation where you can sign in or create an account with the invited email address.',
  },
  {
    q: 'Who can install applications for a business?',
    a: 'Business Admins and Managers (and members with manage permission) install apps for the organization. Employees use apps that are already installed.',
  },
  {
    q: 'How do I manage billing?',
    a: 'Sign in and go to /billing or open Billing from your profile settings.',
  },
  {
    q: 'Where can I get help?',
    a: 'Read /docs, submit a support ticket at /support (sign-in required), or use the contact form at /contact.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold" style={{ color: COLORS.infoBlue }}>
              Vssyl
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/docs" className="text-sm text-gray-700 dark:text-gray-300">
                Docs
              </Link>
              <Link href="/support" className="text-sm text-gray-700 dark:text-gray-300">
                Support
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">Help Center</h1>

        <div className="space-y-6 mb-12">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-gray-200 dark:border-slate-700 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{faq.q}</h2>
              <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-gray-50 dark:bg-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-2">Still need help?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Open a support ticket (requires sign-in) or send us a message.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/support"
              className="px-4 py-2 rounded-md text-white text-sm font-medium"
              style={{ backgroundColor: COLORS.infoBlue }}
            >
              Support tickets
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-800 dark:text-gray-200"
            >
              Contact us
            </Link>
            <Link href="/status" className="px-4 py-2 text-sm font-medium underline" style={{ color: COLORS.infoBlue }}>
              System status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
