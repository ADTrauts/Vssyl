export type Audience = 'personal' | 'business';

export interface FeatureCardContent {
  title: string;
  description: string;
  bullets: [string, string, string];
}

export interface ModuleCardContent {
  title: string;
  description: string;
}

/** Keys must match `pricingConfig.tier` from /api/pricing (lowercase). */
export interface PricingTierContent {
  tierKey: string;
  name: string;
  /** Shown when /api/pricing is unavailable. */
  fallbackPriceLabel: string;
  fallbackYearlyLabel: string;
  subtitle: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  /** Highlights the tier card (e.g. Pro, Business Advanced). */
  highlight?: boolean;
}

export interface LandingAudienceContent {
  hero: {
    line1: string;
    line2Accent: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  featuresSectionTitle: string;
  featuresSectionSubtitle: string;
  featureCards: FeatureCardContent[];
  modulesSectionTitle: string;
  modulesSectionSubtitle: string;
  moduleCards: ModuleCardContent[];
  pricingSectionTitle: string;
  pricingSectionSubtitle: string;
  pricingTiers: PricingTierContent[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaPrimary: string;
  footerTagline: string;
}

const business: LandingAudienceContent = {
  hero: {
    line1: 'Your AI-Powered',
    line2Accent: 'Digital Workspace',
    subtitle:
      'Vssyl combines advanced AI intelligence with modular productivity tools to create the ultimate digital workspace that learns, adapts, and grows with your team.',
    primaryCta: 'Get Started',
    secondaryCta: 'Learn More',
  },
  featuresSectionTitle: 'Powerful Features for Modern Teams',
  featuresSectionSubtitle:
    'Everything you need to boost productivity, collaborate effectively, and make data-driven decisions.',
  featureCards: [
    {
      title: 'AI Digital Life Twin',
      description:
        'Advanced AI that learns your patterns, preferences, and workflows to provide intelligent assistance and automation.',
      bullets: ['Predictive intelligence', 'Automated workflows', 'Personalized recommendations'],
    },
    {
      title: 'Modular Platform',
      description:
        'Extensible architecture with a marketplace of applications. Add only what you need, when you need it.',
      bullets: ['Third-party integrations', 'Custom applications', 'Developer marketplace'],
    },
    {
      title: 'Team Collaboration',
      description:
        'Real-time collaboration tools that keep your team connected and productive, wherever they are.',
      bullets: ['Live chat & messaging', 'File sharing', 'Real-time notifications'],
    },
    {
      title: 'Team Analytics',
      description:
        'Workspace insights and activity visibility to help admins understand adoption — not a full BI suite.',
      bullets: ['Activity visibility', 'Module-level metrics where available', 'Admin dashboards'],
    },
    {
      title: 'Security & Compliance',
      description:
        'Strong access controls, audit logging, and privacy practices designed for business workspaces.',
      bullets: ['Role-based access', 'Tenant isolation', 'Privacy policy & terms'],
    },
    {
      title: 'Cloud Platform',
      description:
        'Reliable cloud infrastructure with scalable architecture for growing teams.',
      bullets: ['HTTPS everywhere', 'Cloud-hosted', 'Production on Google Cloud'],
    },
  ],
  modulesSectionTitle: 'Essential Productivity Applications',
  modulesSectionSubtitle:
    'Core applications that power your daily workflow, with more available in our marketplace.',
  moduleCards: [
    {
      title: 'Chat & Messaging',
      description: 'Real-time communication with file sharing and reactions',
    },
    {
      title: 'Drive & Files',
      description: 'Secure file storage with advanced sharing and collaboration',
    },
    {
      title: 'Calendar & Scheduling',
      description: 'Smart scheduling with AI-powered optimization',
    },
    {
      title: 'AI Assistant',
      description: 'Intelligent automation and personalized recommendations',
    },
  ],
  pricingSectionTitle: 'Vssyl Business pricing',
  pricingSectionSubtitle:
    'Three team plans with monthly or yearly billing. Prices update from our billing system when available.',
  pricingTiers: [
    {
      tierKey: 'business_basic',
      name: 'Business Basic',
      fallbackPriceLabel: '$49.99/mo',
      fallbackYearlyLabel: '$499.99/yr',
      subtitle: 'Solid team tools, AI, and collaboration for growing organizations.',
      features: [
        'Core business applications',
        'Team management',
        'Generous storage',
        'Business-grade security',
      ],
      ctaLabel: 'Get started',
      ctaHref: '/auth/register',
    },
    {
      tierKey: 'business_advanced',
      name: 'Business Advanced',
      fallbackPriceLabel: '$69.99/mo',
      fallbackYearlyLabel: '$699.99/yr',
      subtitle: 'Advanced AI, analytics, and controls for larger or regulated teams.',
      features: [
        'Everything in Business Basic',
        'Advanced AI settings',
        'Advanced analytics',
        'DLP and deeper controls',
      ],
      ctaLabel: 'Get started',
      ctaHref: '/auth/register',
      highlight: true,
    },
    {
      tierKey: 'enterprise',
      name: 'Enterprise',
      fallbackPriceLabel: 'Custom',
      fallbackYearlyLabel: 'Custom',
      subtitle: 'Volume, compliance, and integrations tailored to your organization.',
      features: [
        'Custom limits and integrations',
        'Dedicated support options',
        'Security and onboarding assistance',
        'Annual and custom contracts',
      ],
      ctaLabel: 'Contact sales',
      ctaHref: '/contact',
    },
  ],
  ctaTitle: 'Ready to Transform Your Workflow?',
  ctaSubtitle: 'Join thousands of teams already using Vssyl to boost productivity and collaboration.',
  ctaPrimary: 'Get Started',
  footerTagline:
    'The revolutionary digital workspace platform that combines AI intelligence with modular productivity tools.',
};

const personal: LandingAudienceContent = {
  hero: {
    line1: 'Your AI-Powered',
    line2Accent: 'Life Hub',
    subtitle:
      'Vssyl brings chat, files, calendar, and an AI assistant into one place—so you can run your personal life with less friction and more clarity.',
    primaryCta: 'Start Free',
    secondaryCta: 'See Features',
  },
  featuresSectionTitle: 'Built for Your Personal Life',
  featuresSectionSubtitle:
    'Stay organized, stay connected, and let AI handle the busywork—without sacrificing privacy.',
  featureCards: [
    {
      title: 'AI Digital Life Twin',
      description:
        'An AI that learns how you work and live—helping you prioritize, remember, and get things done.',
      bullets: ['Smarter reminders', 'Natural-language help', 'Routines that fit you'],
    },
    {
      title: 'Modular Platform',
      description:
        'Turn on the applications you want—chat, drive, calendar, and more—so your hub stays uncluttered.',
      bullets: ['Pick what you use', 'Expand anytime', 'Marketplace add-ons'],
    },
    {
      title: 'Household & Connections',
      description:
        'Keep family, friends, and collaborators in sync with chat, shared files, and clear notifications.',
      bullets: ['Real-time chat', 'Easy file sharing', 'Helpful alerts'],
    },
    {
      title: 'Personal Insights',
      description:
        'Lightweight visibility into your habits and schedule—so you can adjust without feeling surveilled.',
      bullets: ['Schedule clarity', 'Simple summaries', 'Actionable nudges'],
    },
    {
      title: 'Privacy & Security',
      description:
        'Your data deserves strong protection—with modern safeguards designed for sensitive personal information.',
      bullets: ['Strong access controls', 'Encryption in transit', 'You stay in control'],
    },
    {
      title: 'Cloud-First',
      description:
        'Access your hub from anywhere with reliable cloud infrastructure and a consistent experience.',
      bullets: ['Fast sync', 'Cross-device access', 'Always-on availability'],
    },
  ],
  modulesSectionTitle: 'Core Apps in One Hub',
  modulesSectionSubtitle:
    'The essentials you already use—unified so you spend less time switching apps.',
  moduleCards: [
    {
      title: 'Chat & Messaging',
      description: 'Stay in touch with threads, sharing, and reactions',
    },
    {
      title: 'Drive & Files',
      description: 'Store and share files with clear, simple organization',
    },
    {
      title: 'Calendar & Scheduling',
      description: 'See your day at a glance with smarter scheduling help',
    },
    {
      title: 'AI Assistant',
      description: 'Ask questions, draft plans, and offload small tasks',
    },
  ],
  pricingSectionTitle: 'Simple personal pricing',
  pricingSectionSubtitle:
    'Free to start, Pro when you want more. Switch between monthly and yearly billing below.',
  pricingTiers: [
    {
      tierKey: 'free',
      name: 'Free',
      fallbackPriceLabel: '$0/mo',
      fallbackYearlyLabel: '$0/yr',
      subtitle: 'Get your hub set up with core applications and AI.',
      features: ['Core AI assistant', 'Core applications included', '5GB storage', 'Basic insights'],
      ctaLabel: 'Get started free',
      ctaHref: '/auth/register',
    },
    {
      tierKey: 'pro',
      name: 'Pro',
      fallbackPriceLabel: '$49.99/mo',
      fallbackYearlyLabel: '$499.99/yr',
      subtitle: 'Full personal experience—more AI, storage, and priority support.',
      features: [
        'Advanced AI features',
        'All core applications + premium',
        '100GB storage',
        'Deeper insights',
        'Priority support',
      ],
      ctaLabel: 'Get Pro',
      ctaHref: '/auth/register',
      highlight: true,
    },
  ],
  ctaTitle: 'Ready to Simplify Your Day?',
  ctaSubtitle:
    'Create your hub in minutes—chat, files, calendar, and AI in one place built for how you live.',
  ctaPrimary: 'Create Your Free Account',
  footerTagline:
    'The AI-powered hub for your personal life—chat, files, calendar, and more in one place.',
};

export const landingContentByAudience: Record<Audience, LandingAudienceContent> = {
  business,
  personal,
};
