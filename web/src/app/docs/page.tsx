'use client';

import React from 'react';
import Link from 'next/link';
import { COLORS } from 'shared/styles/theme';

const sections = [
  {
    title: 'Getting started',
    items: [
      { label: 'Create your account', href: '/auth/register' },
      { label: 'Sign in', href: '/auth/login' },
      { label: 'Join your team (invitation)', href: '/auth/accept-invitation' },
    ],
  },
  {
    title: 'Personal workspace',
    items: [
      { label: 'Your dashboard is your home — add widgets and core apps from the build-out prompt.' },
      { label: 'Core apps: Chat, Drive (File Hub), Calendar, and AI Assistant ship with the platform.' },
      { label: 'Browse and install additional apps from Applications after sign-in.' },
    ],
  },
  {
    title: 'Business workspace',
    items: [
      { label: 'Create a business from the dashboard or /business/create — core apps bootstrap automatically.' },
      { label: 'Invite teammates by email; they accept via the link in their invitation.' },
      { label: 'Admins install business-scoped apps from the business Applications page.' },
      { label: 'Manage plans and billing at /billing.' },
    ],
  },
  {
    title: 'Developers',
    items: [
      { label: 'Submit modules after sign-in at /modules/submit', href: '/modules/submit' },
      { label: 'Developer portal (stats & revenue)', href: '/developer-portal' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold" style={{ color: COLORS.infoBlue }}>
              Vssyl
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/help" className="text-sm text-gray-700 dark:text-gray-300">
                Help
              </Link>
              <Link href="/auth/login" className="text-sm text-gray-700 dark:text-gray-300">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Documentation</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
          Getting started with Vssyl — curated from our product architecture. For detailed developer guides, sign in and visit the developer portal.
        </p>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{section.title}</h2>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300">
                    {'href' in item && item.href ? (
                      <Link href={item.href} className="underline" style={{ color: COLORS.infoBlue }}>
                        {item.label}
                      </Link>
                    ) : (
                      item.label
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
