'use client';

import React, { useEffect, useState } from 'react';
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
  Globe,
  Sparkles,
} from 'lucide-react';
import { COLORS } from 'shared/styles/theme';
import {
  type Audience,
  landingContentByAudience,
  type PricingTierContent,
} from './landingContent';
import {
  type BillingCycle,
  type PricingApiRow,
  buildTierPriceMap,
  getTierPriceDisplay,
} from './landingPricing';

const LANDING_AUDIENCE_KEY = 'vssyl-landing-audience';
const LANDING_BILLING_KEY = 'vssyl-landing-billing-cycle';

const featureIcons = [Brain, Zap, Users, BarChart3, Shield, Globe] as const;

const LandingPage = () => {
  const [audience, setAudience] = useState<Audience>('personal');
  const [storageReady, setStorageReady] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [pricingRows, setPricingRows] = useState<PricingApiRow[]>([]);
  const [pricingLoaded, setPricingLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LANDING_AUDIENCE_KEY);
      if (raw === 'personal' || raw === 'business') {
        setAudience(raw);
      }
    } catch {
      /* ignore */
    }
    try {
      const b = window.localStorage.getItem(LANDING_BILLING_KEY);
      if (b === 'monthly' || b === 'yearly') {
        setBillingCycle(b);
      }
    } catch {
      /* ignore */
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(LANDING_AUDIENCE_KEY, audience);
    } catch {
      /* ignore */
    }
  }, [audience, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(LANDING_BILLING_KEY, billingCycle);
    } catch {
      /* ignore */
    }
  }, [billingCycle, storageReady]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/pricing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { pricing?: PricingApiRow[] } | null) => {
        if (cancelled || !data || !Array.isArray(data.pricing)) return;
        setPricingRows(data.pricing);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPricingLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const content = landingContentByAudience[audience];
  const tierPriceMap = pricingLoaded ? buildTierPriceMap(pricingRows) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-y-3 min-h-16 py-2 sm:py-0 sm:h-16">
            <div className="flex items-center gap-4 sm:gap-8 order-1">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold" style={{ color: COLORS.infoBlue }}>
                  Vssyl
                </h1>
              </div>
              <div
                className="inline-flex rounded-lg border border-gray-200 dark:border-slate-600 p-0.5 bg-gray-50 dark:bg-slate-800"
                role="group"
                aria-label="Choose personal or business information"
              >
                {(['personal', 'business'] as const).map((key) => {
                  const selected = audience === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setAudience(key)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        selected
                          ? 'text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                      style={
                        selected
                          ? { backgroundColor: COLORS.infoBlue }
                          : { backgroundColor: 'transparent' }
                      }
                    >
                      {key === 'personal' ? 'Personal' : 'Business'}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4 order-2 ml-auto">
              <Link
                href="/auth/login"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-md text-sm font-medium"
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
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {content.hero.line1}
              <span className="block" style={{ color: COLORS.infoBlue }}>
                {content.hero.line2Accent}
              </span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              {content.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: COLORS.infoBlue }}
              >
                {content.hero.primaryCta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-slate-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
              >
                {content.hero.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {content.featuresSectionTitle}
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-400 max-w-3xl mx-auto">
              {content.featuresSectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.featureCards.map((card, index) => {
              const Icon = featureIcons[index];
              return (
                <div
                  key={`${audience}-feature-${card.title}`}
                  className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <Icon className="h-8 w-8 mr-3" style={{ color: COLORS.infoBlue }} />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-400 mb-4">{card.description}</p>
                  <ul className="space-y-2">
                    {card.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-center text-sm text-gray-700 dark:text-gray-400"
                      >
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500 shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Modules Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {content.modulesSectionTitle}
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-400 max-w-3xl mx-auto">
              {content.modulesSectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              MessageSquare,
              FolderOpen,
              Calendar,
              Sparkles,
            ].map((Icon, index) => {
              const mod = content.moduleCards[index];
              return (
                <div
                  key={`${audience}-mod-${mod.title}`}
                  className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center"
                >
                  <Icon className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.infoBlue }} />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-400 text-sm">{mod.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {content.pricingSectionTitle}
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-400 max-w-3xl mx-auto">
              {content.pricingSectionSubtitle}
            </p>
            <div className="mt-8 flex justify-center">
              <div
                className="inline-flex rounded-lg border border-gray-200 dark:border-slate-600 p-0.5 bg-gray-50 dark:bg-slate-800"
                role="group"
                aria-label="Choose monthly or yearly billing"
              >
                {(['monthly', 'yearly'] as const).map((cycle) => {
                  const selected = billingCycle === cycle;
                  return (
                    <button
                      key={cycle}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setBillingCycle(cycle)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors min-w-[7rem] ${
                        selected
                          ? 'text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                      style={
                        selected
                          ? { backgroundColor: COLORS.infoBlue }
                          : { backgroundColor: 'transparent' }
                      }
                    >
                      {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 gap-8 ${
              content.pricingTiers.length === 2
                ? 'md:grid-cols-2 max-w-4xl mx-auto'
                : 'md:grid-cols-3'
            }`}
          >
            {content.pricingTiers.map((tier: PricingTierContent) => {
              const highlight = Boolean(tier.highlight);
              const { main, suffix } = getTierPriceDisplay(
                tier,
                billingCycle,
                tierPriceMap,
                pricingLoaded
              );
              return (
                <div
                  key={`${audience}-tier-${tier.tierKey}`}
                  className={
                    highlight
                      ? 'bg-white dark:bg-slate-900 border-2 rounded-lg p-8 shadow-lg relative'
                      : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-8 shadow-md'
                  }
                  style={highlight ? { borderColor: COLORS.infoBlue } : undefined}
                >
                  {highlight && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span
                        className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: COLORS.infoBlue }}
                      >
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {tier.name}
                    </h3>
                    <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      {main}
                      {suffix ? (
                        <span className="text-lg font-normal text-gray-700 dark:text-gray-400">
                          {suffix}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-gray-700 dark:text-gray-400 mb-6">{tier.subtitle}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckCircle className="h-5 w-5 mr-3 text-green-500 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.ctaHref}
                    className={
                      highlight
                        ? 'w-full block text-center py-3 px-4 rounded-md text-white hover:opacity-90 transition-opacity'
                        : 'w-full block text-center py-3 px-4 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors'
                    }
                    style={highlight ? { backgroundColor: COLORS.infoBlue } : undefined}
                  >
                    {tier.ctaLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{content.ctaTitle}</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">{content.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
            >
              {content.ctaPrimary}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white dark:bg-slate-900 hover:text-blue-600 transition-colors"
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
              <p className="text-gray-300">{content.footerTagline}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-gray-300 hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-gray-300 hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/modules" className="text-gray-300 hover:text-white">
                    Applications
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="text-gray-300 hover:text-white">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-gray-300 hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-300 hover:text-white">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-gray-300 hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-gray-300 hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-gray-300 hover:text-white">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-gray-300 hover:text-white">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-gray-300 hover:text-white">
                    Status
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-300 hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-300">© 2026 Vssyl. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
