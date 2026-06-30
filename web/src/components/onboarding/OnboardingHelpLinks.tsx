'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, HelpCircle, LifeBuoy, Shield, CreditCard } from 'lucide-react';

interface OnboardingHelpLinksProps {
  className?: string;
  compact?: boolean;
}

const LINKS = [
  { href: '/docs', label: 'Getting Started', icon: BookOpen },
  { href: '/help', label: 'Help', icon: HelpCircle },
  { href: '/support', label: 'Support', icon: LifeBuoy },
  { href: '/security', label: 'Security', icon: Shield },
  { href: '/billing', label: 'Billing', icon: CreditCard },
] as const;

export function OnboardingHelpLinks({ className = '', compact = false }: OnboardingHelpLinksProps) {
  if (compact) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs ${className}`}>
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={`border-t border-gray-200 dark:border-slate-700 pt-4 ${className}`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">
        Need help or want to learn more?
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default OnboardingHelpLinks;
