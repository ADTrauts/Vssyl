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

export interface PricingTierContent {
  name: string;
  priceMain: string;
  priceSuffix: string;
  subtitle: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
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
  pricingTiers: [PricingTierContent, PricingTierContent, PricingTierContent];
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
    primaryCta: 'Start Free Trial',
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
        'Extensible architecture with a marketplace of modules. Add only what you need, when you need it.',
      bullets: ['Third-party integrations', 'Custom modules', 'Developer marketplace'],
    },
    {
      title: 'Team Collaboration',
      description:
        'Real-time collaboration tools that keep your team connected and productive, wherever they are.',
      bullets: ['Live chat & messaging', 'File sharing', 'Real-time notifications'],
    },
    {
      title: 'Advanced Analytics',
      description:
        'Comprehensive analytics platform with real-time insights, predictive intelligence, and AI-powered recommendations.',
      bullets: ['Real-time dashboards', 'Predictive insights', 'Business intelligence'],
    },
    {
      title: 'Enterprise Security',
      description:
        'Bank-level security with advanced compliance features, audit logging, and data protection.',
      bullets: ['GDPR & HIPAA compliance', 'End-to-end encryption', 'Audit trails'],
    },
    {
      title: 'Global Platform',
      description:
        'Scalable cloud infrastructure with global reach, multi-language support, and 99.9% uptime.',
      bullets: ['Global CDN', 'Multi-region deployment', '24/7 monitoring'],
    },
  ],
  modulesSectionTitle: 'Essential Productivity Modules',
  modulesSectionSubtitle:
    'Core modules that power your daily workflow, with more available in our marketplace.',
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
  pricingSectionTitle: 'Simple, Transparent Pricing',
  pricingSectionSubtitle: 'Choose the plan that fits your needs. Start free and scale as you grow.',
  pricingTiers: [
    {
      name: 'Free',
      priceMain: '$0',
      priceSuffix: '/month',
      subtitle: 'Perfect for individuals getting started',
      features: ['Basic AI assistant', 'Core modules included', '5GB storage', 'Basic analytics'],
      ctaLabel: 'Get Started Free',
      ctaHref: '/auth/register',
    },
    {
      name: 'Pro',
      priceMain: '$29',
      priceSuffix: '/month',
      subtitle: 'For professionals and growing teams',
      features: [
        'Advanced AI features',
        'All core modules + premium',
        '100GB storage',
        'Advanced analytics',
        'Priority support',
      ],
      ctaLabel: 'Start Pro Trial',
      ctaHref: '/auth/register',
    },
    {
      name: 'Enterprise',
      priceMain: 'Custom',
      priceSuffix: '',
      subtitle: 'For large organizations with custom needs',
      features: [
        'Full AI capabilities',
        'Unlimited modules',
        'Unlimited storage',
        'Custom integrations',
        '24/7 dedicated support',
      ],
      ctaLabel: 'Contact Sales',
      ctaHref: '/contact',
    },
  ],
  ctaTitle: 'Ready to Transform Your Workflow?',
  ctaSubtitle: 'Join thousands of teams already using Vssyl to boost productivity and collaboration.',
  ctaPrimary: 'Start Your Free Trial',
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
        'Turn on the modules you want—chat, drive, calendar, and more—so your hub stays uncluttered.',
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
  pricingSectionTitle: 'Simple, Transparent Pricing',
  pricingSectionSubtitle: 'Start free. Upgrade when you want more AI, storage, and power features.',
  pricingTiers: [
    {
      name: 'Free',
      priceMain: '$0',
      priceSuffix: '/month',
      subtitle: 'Great for getting your personal hub set up',
      features: ['Core AI assistant', 'Core modules included', '5GB storage', 'Basic insights'],
      ctaLabel: 'Get Started Free',
      ctaHref: '/auth/register',
    },
    {
      name: 'Pro',
      priceMain: '$29',
      priceSuffix: '/month',
      subtitle: 'For power users who want the full personal experience',
      features: [
        'Advanced AI features',
        'All core modules + premium',
        '100GB storage',
        'Deeper insights',
        'Priority support',
      ],
      ctaLabel: 'Start Pro Trial',
      ctaHref: '/auth/register',
    },
    {
      name: 'Enterprise',
      priceMain: 'Custom',
      priceSuffix: '',
      subtitle: 'For families or groups with advanced needs',
      features: [
        'Full AI capabilities',
        'Unlimited modules',
        'Unlimited storage',
        'Custom integrations',
        'Dedicated support options',
      ],
      ctaLabel: 'Contact Us',
      ctaHref: '/contact',
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
