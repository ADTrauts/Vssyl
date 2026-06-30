'use client';

import React from 'react';
import Link from 'next/link';
import { COLORS } from 'shared/styles/theme';
import { Activity, CheckCircle } from 'lucide-react';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold" style={{ color: COLORS.infoBlue }}>
              Vssyl
            </Link>
            <Link href="/" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-8 h-8" style={{ color: COLORS.infoBlue }} />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">System Status</h1>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-6 mb-8">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-semibold">
            <CheckCircle className="w-5 h-5" />
            All systems operational
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            No active incidents reported. This page is manually maintained during early access.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { name: 'Web application (vssyl.com)', status: 'Operational' },
            { name: 'API & authentication', status: 'Operational' },
            { name: 'File storage', status: 'Operational' },
            { name: 'Realtime (chat & notifications)', status: 'Operational' },
          ].map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-slate-700"
            >
              <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">{item.status}</span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-gray-500">
          Experiencing an issue?{' '}
          <Link href="/support" className="underline" style={{ color: COLORS.infoBlue }}>
            Contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
