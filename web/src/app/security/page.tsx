'use client';

import React from 'react';
import Link from 'next/link';
import { COLORS } from 'shared/styles/theme';
import { Shield, Lock, Server, FileText } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold" style={{ color: COLORS.infoBlue }}>
              Vssyl
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-white px-4 py-2 rounded-md text-sm font-medium"
                style={{ backgroundColor: COLORS.infoBlue }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Security &amp; Privacy</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
          How Vssyl protects your workspace data. This overview reflects our current product practices — not a formal certification statement.
        </p>

        <div className="grid gap-8">
          <section className="flex gap-4">
            <Shield className="w-8 h-8 flex-shrink-0" style={{ color: COLORS.infoBlue }} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Tenant isolation</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Personal, business, and household workspaces are scoped separately. API and database paths enforce{' '}
                <code className="text-sm">dashboardId</code> and business membership checks before reads or writes.
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <Lock className="w-8 h-8 flex-shrink-0" style={{ color: COLORS.infoBlue }} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication &amp; access</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Passwords are hashed with bcrypt. Sessions use signed JWTs. Business roles (Admin, Manager, Employee) control module installation and administrative actions.
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <Server className="w-8 h-8 flex-shrink-0" style={{ color: COLORS.infoBlue }} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Infrastructure</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Production runs on Google Cloud (Cloud Run, Cloud Storage). HTTPS is required for all user-facing traffic. File uploads use scoped storage paths per tenant.
              </p>
            </div>
          </section>

          <section className="flex gap-4">
            <FileText className="w-8 h-8 flex-shrink-0" style={{ color: COLORS.infoBlue }} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Policies &amp; AI boundaries</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                AI features use module-authorized context providers — not unrestricted access to your entire account. Personal and business AI contexts are separated by workspace scope.
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                <li>
                  <Link href="/privacy" className="underline" style={{ color: COLORS.infoBlue }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="underline" style={{ color: COLORS.infoBlue }}>
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </section>
        </div>

        <p className="mt-12 text-sm text-gray-500 dark:text-gray-500">
          Questions? <Link href="/contact" className="underline" style={{ color: COLORS.infoBlue }}>Contact us</Link> or{' '}
          <Link href="/support" className="underline" style={{ color: COLORS.infoBlue }}>open a support ticket</Link> (sign-in required).
        </p>
      </div>
    </div>
  );
}
